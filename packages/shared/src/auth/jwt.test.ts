import { randomUUID } from "node:crypto";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { decodeJwt, exportJWK, generateKeyPair, SignJWT, type CryptoKey, type JWK } from "jose";
import { createPublicKeyLoader, verifyAuthToken } from "./jwt.js";
import { readAuthPolicy } from "./policy.js";

let privateKey: CryptoKey;
let publicKey: CryptoKey;
let wrongKey: CryptoKey;
let wrongPrivateKey: CryptoKey;
let jwk: JWK;
beforeAll(async () => {
  const keys = await generateKeyPair("RS256", { extractable: true });
  privateKey = keys.privateKey; publicKey = keys.publicKey;
  const other = await generateKeyPair("RS256", { extractable: true });
  wrongKey = other.publicKey; wrongPrivateKey = other.privateKey;
  jwk = { ...await exportJWK(publicKey), kid: "K1", use: "sig", alg: "RS256" };
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); vi.restoreAllMocks(); });

async function token(payload: Record<string, unknown> = {}, header: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ sub: "user-1", role: "CUSTOMER", type: "access", iss: "fitsupply-auth-service", aud: "fitsupply-api", iat: now, exp: now + 900, jti: randomUUID(), ...payload })
    .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: "K1", ...header }).sign(privateKey);
}

describe("strict access-token contract", () => {
  it("verifies a valid signed token", async () => { expect(await verifyAuthToken(await token(), publicKey, "access")).toMatchObject({ sub: "user-1", role: "CUSTOMER" }); });
  it.each([
    { iss: "wrong" }, { aud: "wrong" }, { sub: "" }, { sub: 2 }, { role: "SUPERADMIN" }, { role: {} }, { type: "refresh" },
    { iat: undefined }, { exp: undefined }, { jti: undefined }, { jti: "bad" }, { exp: "tomorrow" }, { iat: "yesterday" },
    { exp: 0 }, { nbf: 9999999999 }, { iat: 9999999999 }, { exp: 9999999999 },
  ])("rejects invalid or missing critical claims %j", async (payload) => {
    await expect(verifyAuthToken(await token(payload), publicKey, "access")).rejects.toThrow();
  });
  it.each([{ kid: undefined }, { kid: "../unsafe" }, { typ: "other" }])("rejects invalid header %j", async (header) => {
    await expect(verifyAuthToken(await token({}, header), publicKey, "access")).rejects.toThrow();
  });
  it("rejects expired tokens, malformed JWTs, wrong keys, payload tampering and algorithm confusion", async () => {
    await expect(verifyAuthToken(await token({ exp: Math.floor(Date.now() / 1000) - 10 }), publicKey, "access")).rejects.toThrow();
    await expect(verifyAuthToken("malformed", publicKey, "access")).rejects.toThrow();
    const valid = await token();
    await expect(verifyAuthToken(valid, wrongKey, "access")).rejects.toThrow();
    const parts = valid.split("."); parts[1] = Buffer.from(JSON.stringify({ sub: "attacker" })).toString("base64url");
    await expect(verifyAuthToken(parts.join("."), publicKey, "access")).rejects.toMatchObject({ code: "ERR_JWS_SIGNATURE_VERIFICATION_FAILED" });
    const modifiedSignature = valid.split(".");
    modifiedSignature[2] = (modifiedSignature[2][0] === "A" ? "B" : "A") + modifiedSignature[2].slice(1);
    await expect(verifyAuthToken(modifiedSignature.join("."), publicKey, "access")).rejects.toMatchObject({ code: "ERR_JWS_SIGNATURE_VERIFICATION_FAILED" });
    const hs = await new SignJWT({ sub: "attacker" }).setProtectedHeader({ alg: "HS256", kid: "K1", typ: "JWT" }).sign(new Uint8Array(32));
    await expect(verifyAuthToken(hs, publicKey, "access")).rejects.toThrow();
  });
  it("ignores token-provided key locations and embedded attacker keys", async () => {
    const fetch = vi.fn(async () => Response.json({ keys: [jwk] })); vi.stubGlobal("fetch", fetch);
    const forged = await new SignJWT(decodeJwt(await token())).setProtectedHeader({ alg: "RS256", typ: "JWT", kid: "K1",
      jku: "https://attacker.invalid/keys", jwk: await exportJWK(wrongKey) }).sign(wrongPrivateKey);
    await expect(verifyAuthToken(forged, createPublicKeyLoader("https://auth.test", "secret"), "access")).rejects.toMatchObject({ code: "ERR_JWS_SIGNATURE_VERIFICATION_FAILED" });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(new URL("https://auth.test/jwks"), expect.objectContaining({ redirect: "error", headers: { "x-internal-secret": "secret" } }));
  });
});

describe("bounded JWKS loader", () => {
  const header = { alg: "RS256", kid: "K1" };
  const policy = { ...readAuthPolicy({}), jwksCacheTtlMs: 1000, jwksStaleMs: 2000, jwksCooldownMs: 1000 };
  it("uses configured URL/secret and shares concurrent/cached loads", async () => {
    const fetch = vi.fn(async () => Response.json({ keys: [jwk] })); vi.stubGlobal("fetch", fetch);
    const get = createPublicKeyLoader("https://auth.test/base", "configured-secret", policy);
    const [first, second] = await Promise.all([get(header), get(header)]);
    expect(first).toBe(second); expect(await get(header)).toBe(first); expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(new URL("https://auth.test/jwks"), { redirect: "error", headers: { "x-internal-secret": "configured-secret" }, signal: expect.any(AbortSignal) });
  });
  it("bounds failed-load retries and keeps loader caches isolated", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 503 })).mockImplementation(async () => Response.json({ keys: [jwk] })); vi.stubGlobal("fetch", fetch);
    const get = createPublicKeyLoader("https://auth.test", "secret", policy);
    await expect(get(header)).rejects.toMatchObject({ status: 503 });
    await expect(get(header)).rejects.toMatchObject({ status: 503 }); expect(fetch).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + 1001); await get(header);
    await createPublicKeyLoader("https://other.test", "other", policy)(header); expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("refreshes unknown kid once per cooldown, without a per-attacker negative cache", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const fetch = vi.fn(async () => Response.json({ keys: [jwk] })); vi.stubGlobal("fetch", fetch);
    const get = createPublicKeyLoader("https://auth.test", "secret", policy); await get(header);
    for (let i = 0; i < 100; i++) await expect(get({ alg: "RS256", kid: `random${i}` })).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(1); vi.setSystemTime(Date.now() + 1001);
    await expect(get({ alg: "RS256", kid: "unknown" })).rejects.toMatchObject({ status: 401 }); expect(fetch).toHaveBeenCalledTimes(2);
    await expect(get({ alg: "HS256", kid: "K1" })).rejects.toMatchObject({ status: 401 }); expect(fetch).toHaveBeenCalledTimes(2);
  });
  it("uses cached keys during bounded outage, then fails closed", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const fetch = vi.fn().mockResolvedValueOnce(Response.json({ keys: [jwk] })).mockImplementation(async () => new Response(null, { status: 503 })); vi.stubGlobal("fetch", fetch);
    const get = createPublicKeyLoader("https://auth.test", "secret", policy); const first = await get(header);
    vi.setSystemTime(Date.now() + 1001); expect(await get(header)).toBe(first);
    vi.setSystemTime(Date.now() + 2001); await expect(get(header)).rejects.toMatchObject({ status: 503 });
  });
  it.each(["private", "duplicate", "algorithm", "empty", "malformed", "oversized"])("rejects invalid JWKS %s safely", async (kind) => {
    const key = kind === "private" ? { ...jwk, d: "private-secret" } : kind === "algorithm" ? { ...jwk, alg: "HS256" } : jwk;
    vi.stubGlobal("fetch", vi.fn(async () => kind === "malformed" ? new Response("not JSON secret") : Response.json({ keys: kind === "empty" ? [] : kind === "duplicate" ? [key, key] : [key], padding: kind === "oversized" ? "é".repeat(33000) : undefined })));
    await expect(createPublicKeyLoader("https://auth.test", "secret", policy)(header)).rejects.toMatchObject({ status: 503, message: "Authentication service unavailable" });
  });
});

describe("auth policy config", () => {
  it.each(["JWT_ACCESS_TTL_SECONDS", "JWT_REFRESH_TTL_SECONDS", "JWT_CLOCK_TOLERANCE_SECONDS", "JWKS_CACHE_TTL_MS", "JWKS_STALE_MS", "JWKS_REFRESH_COOLDOWN_MS", "JWT_KEY_RELOAD_MS"])("validates %s", (name) => {
    for (const value of ["", "-1", "bad", "1.5", "9999999999"]) expect(() => readAuthPolicy({ [name]: value })).toThrow();
  });
  it("rejects blank issuer/audience and preserves explicit contract", () => {
    expect(() => readAuthPolicy({ JWT_ISSUER: " " })).toThrow(); expect(() => readAuthPolicy({ JWT_AUDIENCE: "" })).toThrow();
    expect(readAuthPolicy({ JWT_ACCESS_TTL_SECONDS: "300" }).accessTtlSeconds).toBe(300);
  });
});
