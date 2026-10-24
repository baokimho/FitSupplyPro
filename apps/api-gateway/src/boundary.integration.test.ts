import { randomUUID } from "node:crypto";
import { createServer, request as httpRequest, type Server } from "node:http";
import { connect } from "node:net";
import { EventEmitter, once } from "node:events";
import express from "express";
import request from "supertest";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { correlationMiddleware, installShutdown, validCorrelationId } from "@shared/utils";
import { logger } from "./logger.js";

const state = vi.hoisted(() => ({ target: "", info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() }));
vi.mock("./logger.js", () => ({ logger: { info: state.info, error: state.error, debug: state.debug, warn: state.warn } }));
vi.mock("./config/index.js", async () => {
  const { loadConfig } = await import("./config/env.js");
  const config = loadConfig({ GATEWAY_SECRET: "gateway-test-secret", NODE_ENV: "test", AUTH_SERVICE_URL: state.target,
    GATEWAY_BODY_LIMIT_BYTES: "1024", GATEWAY_RATE_LIMIT: "100", PROXY_TIMEOUT_MS: "200", CORS_ALLOWED_ORIGINS: "https://shop.test" });
  for (const key of ["catalogServiceUrl", "inventoryServiceUrl", "cartServiceUrl", "orderServiceUrl", "paymentServiceUrl", "shippingServiceUrl", "notificationServiceUrl"] as const) config[key] = state.target;
  return { config };
});

async function listen(server: Server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing test address");
  return address.port;
}
async function close(server: Server) {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
}

describe("real Gateway HTTP boundary", () => {
  let upstream: Server;
  let gateway: Server;
  let port: number;
  let app: express.Express;
  let token: string;
  let expired: string;
  let admin: string;
  const invalidTokens = new Map<string, string>();
  let readiness: { stopping: boolean };
  let delayedEntered: (() => void) | undefined;
  let releaseDelayed: (() => void) | undefined;
  const seen: Array<{ url: string; headers: import("node:http").IncomingHttpHeaders; body: string }> = [];

  beforeAll(async () => {
    const keys = await generateKeyPair("RS256");
    const jwk = { ...await exportJWK(keys.publicKey), kid: "gateway-boundary", alg: "RS256", use: "sig" };
    const sign = (role: string, expiration: string) => new SignJWT({ email: "person@test.invalid", name: "Person", role, type: "access" })
      .setProtectedHeader({ alg: "RS256", typ: "JWT", kid: "gateway-boundary" }).setIssuedAt().setJti(randomUUID()).setSubject("verified-user").setIssuer("fitsupply-auth-service")
      .setAudience("fitsupply-api").setExpirationTime(expiration).sign(keys.privateKey);
    token = await sign("CUSTOMER", "5m");
    expired = await sign("CUSTOMER", "-10s");
    admin = await sign("ADMIN", "5m");
    const now = Math.floor(Date.now() / 1000);
    const claims = { sub: "verified-user", role: "CUSTOMER", type: "access", iss: "fitsupply-auth-service", aud: "fitsupply-api", iat: now, exp: now + 300, jti: randomUUID() };
    const header = { alg: "RS256", typ: "JWT", kid: "gateway-boundary" };
    invalidTokens.set("wrong-issuer", await new SignJWT({ ...claims, iss: "untrusted-issuer" }).setProtectedHeader(header).sign(keys.privateKey));
    invalidTokens.set("wrong-audience", await new SignJWT({ ...claims, aud: "another-api" }).setProtectedHeader(header).sign(keys.privateKey));
    invalidTokens.set("forged", await new SignJWT(claims).setProtectedHeader(header).sign((await generateKeyPair("RS256")).privateKey));
    invalidTokens.set("unsupported-algorithm", await new SignJWT(claims).setProtectedHeader({ ...header, alg: "HS256" }).sign(new Uint8Array(32)));
    const invalidClaims: Record<string, unknown> = { ...claims, sub: 42 };
    invalidTokens.set("invalid-claims", await new SignJWT(invalidClaims).setProtectedHeader(header).sign(keys.privateKey));
    invalidTokens.set("missing-kid", await new SignJWT(claims).setProtectedHeader({ alg: "RS256", typ: "JWT" }).sign(keys.privateKey));
    invalidTokens.set("refresh", await new SignJWT({ ...claims, type: "refresh" }).setProtectedHeader(header).sign(keys.privateKey));
    upstream = createServer(async (req, res) => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const body = Buffer.concat(chunks).toString();
      seen.push({ url: req.url ?? "", headers: req.headers, body });
      if (req.url === "/jwks") { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ keys: [jwk] })); return; }
      if (req.url === "/hang") return;
      if (req.url === "/delayed") {
        await new Promise<void>((resolve) => { releaseDelayed = resolve; delayedEntered?.(); });
        res.end("completed");
        return;
      }
      if (req.url === "/trickle") {
        res.writeHead(200, { "content-type": "text/plain" });
        const timer = setInterval(() => res.write("x"), 20);
        res.once("close", () => clearInterval(timer));
        return;
      }
      if (req.url === "/reset") { req.socket.destroy(); return; }
      if (req.url === "/malformed") { req.socket.end("HTTP/1.1 nonsense\r\n\r\n"); return; }
      if (req.url === "/failure") { res.writeHead(500, { "content-type": "application/json" }); res.end('{"error":{"code":"DOMAIN_FAILURE","message":"Domain failure"}}'); return; }
      res.writeHead(200, { "content-type": "application/json", "x-request-id": "spoofed-upstream", "access-control-allow-origin": "*", "x-content-type-options": "unsafe",
        "connection": "x-upstream-private", "x-upstream-private": "must-strip" });
      res.end(JSON.stringify({ url: req.url, headers: req.headers, body }));
    });
    state.target = `http://127.0.0.1:${await listen(upstream)}`;
    const module = await import("./app.js");
    readiness = (await import("./health.js")).readiness;
    app = module.createApp();
    gateway = createServer(app);
    port = await listen(gateway);
  });
  afterAll(async () => { readiness.stopping = false; await close(gateway); await close(upstream); });

  it("propagates verified JWT identity and strips arbitrary, credential and forwarding headers", async () => {
    const id = "fce5c467-811f-42c7-b665-9a93b6d8300b";
    const response = await request(app).get("/cart/echo?url=http://evil.invalid").set("Authorization", `Bearer ${token}`)
      .set("x-user-id", "attacker").set("x-user-role", "ADMIN").set("x-user-email", "secret@test.invalid")
      .set("x-authenticated-user", "attacker").set("x-service-name", "auth-service").set("x-internal-anything", "spoof")
      .set("x-internal-secret", "spoof").set("Forwarded", "for=evil").set("x-forwarded-for", "192.0.2.1")
      .set("x-forwarded-host", "evil.invalid").set("x-forwarded-proto", "https").set("Cookie", "refresh_token=secret")
      .set("x-request-id", id).set("x-trace-id", id).set("Idempotency-Key", "stable-key")
      .set("Connection", "x-custom-hop, accept-language").set("x-custom-hop", "secret").set("Accept-Language", "en").expect(200);
    expect(response.body.headers).toMatchObject({ "x-user-id": "verified-user", "x-user-role": "CUSTOMER", "x-internal-secret": "gateway-test-secret", "idempotency-key": "stable-key" });
    for (const name of ["authorization", "cookie", "x-user-email", "x-authenticated-user", "x-service-name", "x-internal-anything", "forwarded", "x-forwarded-for", "x-forwarded-host", "x-forwarded-proto", "x-custom-hop", "accept-language"]) expect(response.body.headers).not.toHaveProperty(name);
    expect(response.body.headers.host).toBe(new URL(state.target).host);
    expect(response.body.url).toBe("/echo?url=http://evil.invalid");
    expect(response.headers["x-request-id"]).toBe(id);
    expect(response.headers["access-control-expose-headers"]).toContain("x-request-id");
    expect(validCorrelationId(response.body.headers["x-request-id"])).toBe(true);
    expect(response.body.headers["x-request-id"]).not.toBe(id);
    expect(validCorrelationId(response.body.headers["x-trace-id"])).toBe(true);
    expect(response.body.headers["x-trace-id"]).not.toBe(id);
    expect(response.headers).not.toHaveProperty("x-upstream-private");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers).not.toHaveProperty("access-control-allow-origin");
    expect(seen.filter((entry) => entry.url === "/jwks")).toHaveLength(1);
    expect(seen.find((entry) => entry.url === "/jwks")?.headers["x-internal-secret"]).toBe("gateway-test-secret");
  });

  it.each(["invalid", "expired", "wrong-scheme", "missing", "wrong-issuer", "wrong-audience", "forged", "unsupported-algorithm", "invalid-claims", "missing-kid", "refresh"])("rejects %s JWT without proxying", async (kind) => {
    const count = seen.length;
    const call = request(app).get("/cart/echo");
    if (kind !== "missing") call.set("Authorization", kind === "wrong-scheme" ? `Basic ${token}` : `Bearer ${kind === "expired" ? expired : invalidTokens.get(kind) ?? "invalid.token.value"}`);
    const response = await call.expect(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(seen).toHaveLength(count);
    expect(response.headers["x-request-id"]).toBeTruthy();
  });

  it("propagates W3C context independently of verified identity and blocks service metrics", async () => {
    const traceparent = "00-0123456789abcdef0123456789abcdef-0123456789abcdef-01";
    const response = await request(app).get("/cart/echo").set("Authorization", `Bearer ${token}`)
      .set("traceparent", traceparent).set("baggage", "email=private@example.com").set("x-user-id", "attacker").expect(200);
    expect(response.body.headers.traceparent).toMatch(/^00-0123456789abcdef0123456789abcdef-[0-9a-f]{16}-01$/);
    expect(response.body.headers.traceparent).not.toBe(traceparent);
    expect(response.body.headers).not.toHaveProperty("baggage");
    expect(response.body.headers["x-user-id"]).toBe("verified-user");
    const count = seen.length;
    await request(app).get("/auth/metrics").expect(403);
    await request(app).get("/cart/metrics").set("Authorization", `Bearer ${token}`).expect(403);
    expect(seen).toHaveLength(count);
  });
  it("public Auth does not receive spoofed identity; exact JSON bytes reach upstream", async () => {
    const body = '{ "hello": "world", "items": [1,2] }';
    const response = await request(app).post("/auth/echo").set("Content-Type", "application/json").set("x-user-id", "attacker").send(body).expect(200);
    expect(response.body.body).toBe(body);
    expect(response.body.headers).not.toHaveProperty("x-user-id");
    expect(Number(response.body.headers["content-length"])).toBe(Buffer.byteLength(body));
    expect(response.body.headers).not.toHaveProperty("transfer-encoding");
  });

  it("Expect cannot bypass proxy identity, body forwarding or deadline hooks", async () => {
    const response = await request(app).post("/cart/echo").set("Authorization", `Bearer ${token}`)
      .set("Expect", "100-continue").set("x-user-id", "attacker").send({ value: 1 }).expect(200);
    expect(response.body.headers["x-user-id"]).toBe("verified-user");
    expect(response.body.headers).not.toHaveProperty("expect");
    expect(response.body.body).toBe('{"value":1}');
    await request(app).post("/auth/hang").set("Expect", "100-continue").send({ value: 1 }).expect(504);
  });

  it("caps chunked bodies and rejects invalid UTF-8 without forwarding", async () => {
    const count = seen.length;
    const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const call = httpRequest({ host: "127.0.0.1", port, path: "/auth/echo", method: "POST", headers: { "content-type": "application/json", "transfer-encoding": "chunked" } }, (res) => {
        let body = ""; res.on("data", (chunk) => { body += chunk; }); res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      }); call.on("error", reject); call.write('{"value":"'); call.write("x".repeat(1100)); call.end('"}');
    });
    expect(response.status).toBe(413);
    expect(JSON.parse(response.body).error.code).toBe("PAYLOAD_TOO_LARGE");
    const invalid = Buffer.from([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xff, 0x22, 0x7d]);
    const status = await new Promise<number>((resolve, reject) => {
      const call = httpRequest({ host: "127.0.0.1", port, path: "/auth/echo", method: "POST", headers: { "content-type": "application/json", "content-length": invalid.length } }, (res) => {
        res.resume(); res.on("end", () => resolve(res.statusCode ?? 0));
      }); call.on("error", reject); call.end(invalid);
    });
    expect(status).toBe(400);
    expect(seen).toHaveLength(count);
  });

  it.each([["oversized", 413], ["malformed", 400], ["content-type", 415], ["compressed", 415]])("rejects %s body before upstream", async (kind, status) => {
    const count = seen.length;
    const call = request(app).post("/auth/echo").set("Content-Type", kind === "content-type" ? "text/plain" : "application/json");
    if (kind === "compressed") call.set("Content-Encoding", "gzip");
    const response = await call.send(kind === "oversized" ? JSON.stringify({ value: "x".repeat(1024) }) : "{ broken JSON and password=private }").expect(status);
    expect(response.body.error).toHaveProperty("code");
    expect(response.text).not.toMatch(/private|SyntaxError|stack|127\.0\.0\.1/);
    expect(seen).toHaveLength(count);
  });

  it("supports configured CORS and secure preflight without authentication", async () => {
    const response = await request(app).options("/cart").set("Origin", "https://shop.test").set("Access-Control-Request-Method", "POST").set("Access-Control-Request-Headers", "authorization,content-type,idempotency-key").expect(204);
    expect(response.headers["access-control-allow-origin"]).toBe("https://shop.test");
    expect(response.headers["access-control-allow-headers"]).toContain("idempotency-key");
    expect(response.headers).not.toHaveProperty("access-control-allow-credentials");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    const get = await request(app).get("/auth/echo").set("Origin", "https://shop.test").expect(200);
    expect(get.headers["access-control-allow-origin"]).toBe("https://shop.test");
    await request(app).get("/health").set("Origin", "https://evil.test").expect(403);
    await request(app).options("/cart").set("Origin", "null").expect(403);
  });

  it("returns shared 404 and delegates service method/domain responses", async () => {
    const response = await request(app).get("/unknown").expect(404);
    expect(response.body).toEqual({ error: { code: "NOT_FOUND", message: "Route not found" } });
    await request(app).get("/cart/echo").set("Authorization", `Bearer ${token}`).expect(200);
    const failure = await request(app).get("/cart/failure").set("Authorization", `Bearer ${token}`).expect(500);
    expect(failure.body).toEqual({ error: { code: "DOMAIN_FAILURE", message: "Domain failure" } });
  });

  it.each(["/cart/%ZZ", "/cart/%2finternal", "/cart/%252finternal", "/cart/../auth", "//evil.test/path", "http://evil.test/path", "/cart/item?q=%XX"])("rejects unsafe raw target %s", async (path) => {
    const count = seen.length;
    const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const call = httpRequest({ host: "127.0.0.1", port, path, headers: { authorization: `Bearer ${token}` } }, (res) => {
        let body = ""; res.on("data", (chunk) => { body += chunk; }); res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      }); call.on("error", reject); call.end();
    });
    expect(response.status).toBe(400);
    expect(JSON.parse(response.body).error.code).toBe("BAD_REQUEST");
    expect(seen).toHaveLength(count);
  });

  it("normalizes encoded static routes before role checks; blocks internal casing", async () => {
    await request(app).post("/catalog/%70roducts").set("Authorization", `Bearer ${token}`).expect(403);
    const response = await request(app).post("/catalog/%70roducts").set("Authorization", `Bearer ${admin}`).expect(200);
    expect(response.body.url).toBe("/products");
    await request(app).get("/cart/INTERNAL/secret").set("Authorization", `Bearer ${token}`).expect(403);
    await request(app).get("/cart/%69nternal/secret").set("Authorization", `Bearer ${token}`).expect(403);
  });

  it.each([["hang", 504, "GATEWAY_TIMEOUT"], ["reset", 502, "BAD_GATEWAY"], ["malformed", 502, "BAD_GATEWAY"]])("normalizes %s upstream safely without retry", async (path, status, code) => {
    const count = seen.length;
    const started = performance.now();
    const response = await request(app).post(`/auth/${path}`).send({ value: 1 }).expect(status);
    expect(response.body.error.code).toBe(code);
    expect(response.text).not.toMatch(/127\.0\.0\.1|ECONN|stack|password/);
    expect(response.headers["x-request-id"]).toBeTruthy();
    expect(seen.length - count).toBe(1);
    expect(performance.now() - started).toBeLessThan(2000);
  });

  it("bounds continuously streaming responses even after headers were sent", async () => {
    const started = performance.now();
    await expect(request(app).get("/auth/trickle")).rejects.toThrow();
    expect(performance.now() - started).toBeLessThan(2000);
  });

  it("returns safe 503 for refused and unresolvable configured upstreams", async () => {
    const { serviceProxy } = await import("./proxy/serviceProxy.js");
    const disposable = createServer();
    const unusedPort = await listen(disposable);
    await close(disposable);
    for (const target of [`http://127.0.0.1:${unusedPort}`, "http://fitsupply-no-service.invalid"]) {
      const instance = express();
      instance.use(correlationMiddleware("gateway"), serviceProxy(target, "fixture-service"));
      const response = await request(instance).get("/").expect(503);
      expect(response.body).toEqual({ error: { code: "SERVICE_UNAVAILABLE", message: "Service unavailable" } });
      expect(response.headers["x-request-id"]).toBeTruthy();
    }
  });

  it("rejects conflicting HTTP framing through Node's parser without proxying", async () => {
    const count = seen.length;
    const result = await new Promise<string>((resolve, reject) => {
      const socket = connect(port, "127.0.0.1", () => socket.write("POST /auth/echo HTTP/1.1\r\nHost: localhost\r\nContent-Length: 4\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n0\r\n\r\n"));
      let output = ""; socket.on("data", (chunk) => { output += chunk; }); socket.on("end", () => resolve(output)); socket.on("error", reject);
    });
    expect(result).toMatch(/^HTTP\/1\.1 400/);
    expect(seen).toHaveLength(count);
  });

  it("draining rejects new work while health stays available", async () => {
    readiness.stopping = true;
    try {
      await request(app).get("/ready").expect(503);
      await request(app).get("/health").expect(200);
      const response = await request(app).get("/auth/echo").expect(503);
      expect(response.headers.connection).toBe("close");
      expect(response.body.error.code).toBe("SERVICE_UNAVAILABLE");
    } finally { readiness.stopping = false; }
  });

  it("SIGTERM drains an accepted proxy response before shutdown completes", async () => {
    const server = createServer(app);
    const shutdownPort = await listen(server);
    const exit = vi.fn();
    const signals = new EventEmitter() as unknown as Pick<NodeJS.Process, "on" | "off">;
    const lifecycle = installShutdown({ server, state: readiness, logger, signals, exit });
    const entered = new Promise<void>((resolve) => { delayedEntered = resolve; });
    const response = new Promise<string>((resolve, reject) => {
      const call = httpRequest({ host: "127.0.0.1", port: shutdownPort, path: "/auth/delayed", agent: false }, (res) => {
        let body = ""; res.on("data", (chunk) => { body += chunk; }); res.on("end", () => resolve(body));
      }); call.on("error", reject); call.end();
    });
    await entered;
    const shutdown = lifecycle.shutdown("SIGTERM");
    try {
      expect(readiness.stopping).toBe(true);
      expect(exit).not.toHaveBeenCalled();
      await request(app).get("/ready").expect(503);
      await request(app).get("/auth/echo").expect(503);
      releaseDelayed?.();
      expect(await response).toBe("completed");
      await shutdown;
      expect(exit).toHaveBeenCalledWith(0);
    } finally { releaseDelayed?.(); lifecycle.dispose(); readiness.stopping = false; }
  });

  it("auth limiter uses socket IP despite changing spoofed forwarded addresses", async () => {
    for (let i = 0; i < 5; i++) await request(app).post("/auth/login").set("x-forwarded-for", `192.0.2.${i}`).expect(200);
    const response = await request(app).post("/auth/login").set("x-forwarded-for", "198.51.100.1").expect(429);
    expect(response.body.error.code).toBe("TOO_MANY_REQUESTS");
    expect(response.headers["retry-after"]).toBeTruthy();
  });

  it("general limiter covers unauthenticated floods and excludes probes", async () => {
    let response = await request(app).get("/unknown");
    for (let i = 0; i < 101 && response.status !== 429; i++) response = await request(app).get("/unknown").set("x-forwarded-for", `192.0.2.${i}`);
    expect(response.status).toBe(429);
    expect(response.headers["ratelimit-remaining"]).toBe("0");
    expect(response.body.error.code).toBe("TOO_MANY_REQUESTS");
    await request(app).get("/health").expect(200);
    await request(app).get("/ready").expect(200);
    expect(JSON.stringify(state.info.mock.calls)).not.toMatch(/Bearer |gateway-test-secret|password=private|refresh_token=secret/);
    expect(JSON.stringify(state.error.mock.calls)).not.toMatch(/Bearer |gateway-test-secret|127\.0\.0\.1|password=private/);
  });
});
