import { createServer, type Server } from "node:http";
import { once } from "node:events";
import { mkdtempSync, writeFileSync, renameSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { exportJWK, generateKeyPair, decodeProtectedHeader, type JWK } from "jose";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupDatabase, createPublicKeyLoader, readAuthPolicy, verifyAuthToken } from "@shared/utils";

const state = vi.hoisted(() => ({ keyring: "" }));
const policy = readAuthPolicy({ JWT_ACCESS_TTL_SECONDS: "60", JWT_REFRESH_TTL_SECONDS: "3600", JWT_KEY_RELOAD_MS: "100", JWKS_CACHE_TTL_MS: "1000", JWKS_REFRESH_COOLDOWN_MS: "1000", JWKS_STALE_MS: "1000" });
vi.mock("./config/index.js", async () => {
  const { loadConfig } = await import("./config/env.js");
  return { config: { ...loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent", DATABASE_URL: process.env.AUTH_DATABASE_URL, GATEWAY_SECRET: "auth-integration-secret" }), authPolicy: policy, jwtKeyringFile: state.keyring } };
});

describe("real Auth credentials, refresh state and key rotation", () => {
  let app: import("express").Express;
  let server: Server;
  let url: string;
  let prisma: typeof import("./config/db.js").default;
  let closeDb: typeof import("./config/db.js").closeDb;
  let directory: string;
  let k1: { privateKey: JWK; publicKey: JWK };
  let k2: typeof k1;
  let userId: string;
  let initialRefresh: string;
  let initialAccess: string;
  const secret = "auth-integration-secret";
  const password = "correct horse battery staple";

  function ring(active: typeof k1, keys: JWK[]) {
    const next = join(directory, "next.json");
    writeFileSync(next, JSON.stringify({ activeKid: active.publicKey.kid, privateKey: active.privateKey, keys }), { mode: 0o600 });
    renameSync(next, state.keyring);
  }
  const credentials = (email = "person@test.invalid") => ({ email, password, name: "Person", role: "ADMIN" });

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), "fitsupply-auth-"));
    state.keyring = join(directory, "keys.json");
    const generate = async (kid: string) => {
      const pair = await generateKeyPair("RS256", { extractable: true });
      return { privateKey: { ...await exportJWK(pair.privateKey), kid, alg: "RS256", use: "sig" }, publicKey: { ...await exportJWK(pair.publicKey), kid, alg: "RS256", use: "sig" } };
    };
    k1 = await generate("K1"); k2 = await generate("K2"); ring(k1, [k1.publicKey]);
  });
  afterAll(async () => {
    vi.useRealTimers();
    if (state.keyring) unlinkSync(state.keyring);
    if (directory) rmdirSync(directory);
  });
  beforeEach(async () => {
    // Each case owns application key cache, Prisma pool, HTTP server and account state.
    vi.resetModules(); vi.stubGlobal("prisma", undefined);
    ring(k1, [k1.publicKey]);
    const db = await import("./config/db.js"); prisma = db.default; closeDb = db.closeDb;
    await cleanupDatabase("auth_test_db", process.env.AUTH_DATABASE_URL!, { execute: async (sql) => { await prisma.$executeRawUnsafe(sql); } });
    await (await import("./services/auth.service.js")).initializeAuthKeys();
    app = (await import("./app.js")).createApp();
    server = createServer(app); server.listen(0, "127.0.0.1"); await once(server, "listening");
    const address = server.address(); if (!address || typeof address === "string") throw new Error("No fixture port");
    url = `http://127.0.0.1:${address.port}`;
    const seed = await request(app).post("/register").set("x-internal-secret", secret).send(credentials()).expect(201);
    userId = seed.body.user.id; initialRefresh = seed.body.refreshToken; initialAccess = seed.body.accessToken;
  });
  afterEach(async () => {
    vi.useRealTimers();
    if (server?.listening) { server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }
    await closeDb?.();
    vi.unstubAllGlobals();
  });

  it("registers CUSTOMER with hashed credentials and atomic hashed refresh state", async () => {
    const response = await request(app).post("/register").set("x-internal-secret", secret).send(credentials("registered@test.invalid")).expect(201);
    userId = response.body.user.id; initialRefresh = response.body.refreshToken; initialAccess = response.body.accessToken;
    expect(response.body.user.role).toBe("CUSTOMER"); expect(response.body.user).not.toHaveProperty("passwordHash");
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.passwordHash).toMatch(/^scrypt:131072:8:1:/); expect(user.passwordHash).not.toContain(password);
    const refresh = await prisma.refreshToken.findMany({ where: { userId } });
    expect(refresh).toHaveLength(1); expect(refresh[0].tokenHash).toMatch(/^[a-f0-9]{64}$/); expect(refresh[0].tokenHash).not.toBe(initialRefresh);
    const get = createPublicKeyLoader(url, secret, policy);
    const payload = await verifyAuthToken(initialAccess, get, "access", policy);
    expect(payload).toMatchObject({ sub: userId, role: "CUSTOMER" });
    for (const field of ["email", "name", "password", "passwordHash"]) expect(payload).not.toHaveProperty(field);
    expect(payload.exp - payload.iat).toBe(60);
  });

  it("keeps duplicate registration races at one user with consistent 409", async () => {
    const responses = await Promise.all([1, 2].map(() => request(app).post("/register").set("x-internal-secret", secret).send(credentials("race@test.invalid"))));
    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(responses.find((r) => r.status === 409)?.body).toEqual({ error: { code: "CONFLICT", message: "Email already exists" } });
    expect(await prisma.user.count({ where: { email: "race@test.invalid" } })).toBe(1);
  });

  it("normalizes login identifiers and rejects unknown/wrong credentials identically", async () => {
    const responses = await Promise.all(["person@test.invalid", "absent@test.invalid"].map((email) => request(app).post("/login").set("x-internal-secret", secret).send({ email, password: "wrong password" })));
    expect(responses[0].status).toBe(401); expect(responses[1].status).toBe(401); expect(responses[0].body).toEqual(responses[1].body);
    expect(responses[0].body).toEqual({ error: { code: "UNAUTHORIZED", message: "Invalid email or password" } });
    const response = await request(app).post("/login").set("x-internal-secret", secret).send({ email: " PERSON@Test.invalid ", password }).expect(200);
    expect(response.body.user.id).toBe(userId); expect(response.body.refreshToken).not.toBe(initialRefresh);
    expect(response.headers["x-request-id"]).toBeTruthy();
  });

  it.each(["short", " ".repeat(12), "x".repeat(129)])("enforces registration policy before persistence", async (value) => {
    const before = await prisma.user.count();
    await request(app).post("/register").set("x-internal-secret", secret).send({ ...credentials(), password: value }).expect(400);
    expect(await prisma.user.count()).toBe(before);
  });

  it("concurrent refresh admits one replacement and reuse revokes all active refresh state", async () => {
    const responses = await Promise.all([1, 2].map(() => request(app).post("/refresh-token").set("x-internal-secret", secret).send({ refreshToken: initialRefresh })));
    expect(responses.map((r) => r.status).sort()).toEqual([200, 401]);
    const original = await prisma.refreshToken.findFirstOrThrow({ where: { userId, replacedByTokenId: { not: null } } });
    expect(original.revokedAt).not.toBeNull(); expect(await prisma.refreshToken.count({ where: { userId, revokedAt: null } })).toBe(0);
    await request(app).post("/refresh-token").set("x-internal-secret", secret).send({ refreshToken: responses.find((r) => r.status === 200)!.body.refreshToken }).expect(401);
  });

  it("logout invalidates persisted refresh credentials; access remains stateless until expiry", async () => {
    const login = await request(app).post("/login").set("x-internal-secret", secret).send({ email: "person@test.invalid", password }).expect(200);
    for (let i = 0; i < 2; i++) await request(app).post("/logout").set("x-internal-secret", secret).send({ refreshToken: login.body.refreshToken }).expect(200);
    await request(app).post("/refresh-token").set("x-internal-secret", secret).send({ refreshToken: login.body.refreshToken }).expect(401);
    expect(await verifyAuthToken(login.body.accessToken, createPublicKeyLoader(url, secret, policy), "access", policy)).toMatchObject({ sub: userId });
  });

  it("refresh uses current DB role while issued access claims remain unchanged", async () => {
    const login = await request(app).post("/login").set("x-internal-secret", secret).send({ email: "person@test.invalid", password }).expect(200);
    await prisma.user.update({ where: { id: userId }, data: { role: "ADMIN" } });
    try {
      const refreshed = await request(app).post("/refresh-token").set("x-internal-secret", secret).send({ refreshToken: login.body.refreshToken }).expect(200);
      const get = createPublicKeyLoader(url, secret, policy);
      expect((await verifyAuthToken(login.body.accessToken, get, "access", policy)).role).toBe("CUSTOMER");
      expect((await verifyAuthToken(refreshed.body.accessToken, get, "access", policy)).role).toBe("ADMIN");
    } finally { await prisma.user.update({ where: { id: userId }, data: { role: "CUSTOMER" } }); }
  });

  it("logout racing refresh leaves no active replacement", async () => {
    const login = await request(app).post("/login").set("x-internal-secret", secret).send({ email: "person@test.invalid", password }).expect(200);
    const [logout, refresh] = await Promise.all([
      request(app).post("/logout").set("x-internal-secret", secret).send({ refreshToken: login.body.refreshToken }),
      request(app).post("/refresh-token").set("x-internal-secret", secret).send({ refreshToken: login.body.refreshToken }),
    ]);
    expect(logout.status).toBe(200); expect([200, 401]).toContain(refresh.status);
    expect(await prisma.refreshToken.count({ where: { userId, revokedAt: null } })).toBe(0);
  });

  it("cleanup retains revoked evidence until after original expiry", async () => {
    const row = await prisma.refreshToken.findFirstOrThrow({ where: { userId } });
    await prisma.refreshToken.update({ where: { id: row.id }, data: { revokedAt: new Date(Date.now() - 20 * 86400000), expiresAt: new Date(Date.now() + 86400000) } });
    await (await import("./services/auth.service.js")).cleanupRefreshTokens(prisma);
    expect(await prisma.refreshToken.findUnique({ where: { id: row.id } })).not.toBeNull();
  });

  it("logout reports database failure instead of claiming revocation succeeded", async () => {
    const login = await request(app).post("/login").set("x-internal-secret", secret).send({ email: "person@test.invalid", password }).expect(200);
    await prisma.$executeRawUnsafe(`CREATE FUNCTION auth_test_reject_logout() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected private logout failure'; END; $$`);
    await prisma.$executeRawUnsafe(`CREATE TRIGGER auth_test_reject_logout BEFORE UPDATE ON "RefreshToken" FOR EACH ROW EXECUTE FUNCTION auth_test_reject_logout()`);
    try {
      const response = await request(app).post("/logout").set("x-internal-secret", secret).send({ refreshToken: login.body.refreshToken }).expect(500);
      expect(response.text).not.toContain("private logout failure");
    } finally { await prisma.$executeRawUnsafe(`DROP TRIGGER auth_test_reject_logout ON "RefreshToken"`); await prisma.$executeRawUnsafe(`DROP FUNCTION auth_test_reject_logout()`); }
  });

  it("expired logout credentials cannot revoke newer active refresh sessions", async () => {
    const login = () => request(app).post("/login").set("x-internal-secret", secret).send({ email: "person@test.invalid", password }).expect(200);
    const old = await login();
    const current = await login();
    const { hashRefreshToken } = await import("./services/auth.service.js");
    await prisma.refreshToken.update({ where: { tokenHash: hashRefreshToken(old.body.refreshToken) }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const before = await prisma.refreshToken.count({ where: { userId, revokedAt: null } });
    await request(app).post("/logout").set("x-internal-secret", secret).send({ refreshToken: old.body.refreshToken }).expect(200);
    expect(await prisma.refreshToken.count({ where: { userId, revokedAt: null } })).toBe(before);
    await request(app).post("/refresh-token").set("x-internal-secret", secret).send({ refreshToken: current.body.refreshToken }).expect(200);
  });

  it("rolls registration back if refresh persistence fails and reports DB failures safely", async () => {
    await prisma.$executeRawUnsafe(`CREATE FUNCTION auth_test_reject_refresh() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected private persistence failure'; END; $$`);
    await prisma.$executeRawUnsafe(`CREATE TRIGGER auth_test_reject_refresh BEFORE INSERT ON "RefreshToken" FOR EACH ROW EXECUTE FUNCTION auth_test_reject_refresh()`);
    try {
      const response = await request(app).post("/register").set("x-internal-secret", secret).send(credentials("rollback@test.invalid")).expect(500);
      expect(response.text).not.toContain("private persistence failure"); expect(await prisma.user.count({ where: { email: "rollback@test.invalid" } })).toBe(0);
    } finally { await prisma.$executeRawUnsafe(`DROP TRIGGER auth_test_reject_refresh ON "RefreshToken"`); await prisma.$executeRawUnsafe(`DROP FUNCTION auth_test_reject_refresh()`); }
  });

  it("publishes public-only JWKS and rotates K1 to K2 without restarting signer or loader", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const get = createPublicKeyLoader(url, secret, policy);
    await verifyAuthToken(initialAccess, get, "access", policy);
    ring(k2, [k1.publicKey, k2.publicKey]); vi.setSystemTime(Date.now() + 1100);
    const login = await request(app).post("/login").set("x-internal-secret", secret).send({ email: "person@test.invalid", password }).expect(200);
    expect(decodeProtectedHeader(login.body.accessToken).kid).toBe("K2");
    expect(await verifyAuthToken(initialAccess, get, "access", policy)).toMatchObject({ sub: userId });
    expect(await verifyAuthToken(login.body.accessToken, get, "access", policy)).toMatchObject({ sub: userId });
    const response = await request(app).get("/jwks").set("x-internal-secret", secret).expect(200);
    expect(response.body.keys.map((key: JWK) => key.kid)).toEqual(["K1", "K2"]);
    expect(response.body.keys.every((key: JWK) => Object.keys(key).sort().join(",") === "alg,e,kid,kty,n,use")).toBe(true);
    // Advance beyond every K1 access/refresh lifetime before retiring its public key.
    vi.setSystemTime(Date.now() + 3_610_000); ring(k2, [k2.publicKey]);
    await expect(verifyAuthToken(initialAccess, get, "access", policy)).rejects.toThrow();
    const fresh = await request(app).post("/login").set("x-internal-secret", secret).send({ email: "person@test.invalid", password }).expect(200);
    expect(await verifyAuthToken(fresh.body.accessToken, get, "access", policy)).toMatchObject({ sub: userId });
    await expect(get({ alg: "RS256", kid: "K1" })).rejects.toMatchObject({ status: 401 });
  });
});
