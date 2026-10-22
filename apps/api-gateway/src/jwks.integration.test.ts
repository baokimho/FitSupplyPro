import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import request from "supertest";
import { exportJWK, generateKeyPair, SignJWT, type CryptoKey, type JWK } from "jose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ target: "" }));
vi.mock("./config/index.js", async () => {
  const { loadConfig } = await import("./config/env.js");
  return { config: loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent", GATEWAY_SECRET: "gateway-jwks-test", AUTH_SERVICE_URL: state.target,
    CART_SERVICE_URL: state.target, JWKS_CACHE_TTL_MS: "1000", JWKS_REFRESH_COOLDOWN_MS: "1000", JWKS_STALE_MS: "1000" }) };
});

describe("real Gateway JWKS lifecycle", () => {
  let upstream: Server;
  let app: import("express").Express;
  let keys: JWK[];
  let fail = false;
  let fetches = 0;
  let k1: CryptoKey;
  let k2: CryptoKey;
  let p1: JWK;
  let p2: JWK;
  beforeAll(async () => {
    const first = await generateKeyPair("RS256", { extractable: true });
    const second = await generateKeyPair("RS256", { extractable: true });
    k1 = first.privateKey; k2 = second.privateKey;
    p1 = { ...await exportJWK(first.publicKey), kid: "K1", alg: "RS256", use: "sig" };
    p2 = { ...await exportJWK(second.publicKey), kid: "K2", alg: "RS256", use: "sig" }; keys = [p1];
    upstream = createServer((req, res) => {
      res.setHeader("content-type", "application/json");
      if (req.url === "/jwks") {
        fetches++;
        if (req.headers["x-internal-secret"] !== "gateway-jwks-test") { res.writeHead(403); res.end("{}"); return; }
        res.writeHead(fail ? 503 : 200); res.end(JSON.stringify(fail ? {} : { keys })); return;
      }
      res.end(JSON.stringify({ id: req.headers["x-user-id"], role: req.headers["x-user-role"], traceId: req.headers["x-trace-id"] }));
    });
    upstream.listen(0, "127.0.0.1"); await once(upstream, "listening");
    const address = upstream.address(); if (!address || typeof address === "string") throw new Error("Missing fixture address");
    state.target = `http://127.0.0.1:${address.port}`;
    app = (await import("./app.js")).createApp();
  });
  afterAll(async () => { vi.useRealTimers(); upstream.closeAllConnections(); await new Promise<void>((resolve) => upstream.close(() => resolve())); });

  it("verifies both rotation keys, limits unknown-kid refresh, bounds stale outage and prunes retired keys", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const sign = (key: CryptoKey, kid: string) => new SignJWT({ sub: "verified-person", role: "CUSTOMER", type: "access" })
      .setProtectedHeader({ alg: "RS256", kid, typ: "JWT" }).setIssuedAt().setExpirationTime("15m").setJti(randomUUID())
      .setIssuer("fitsupply-auth-service").setAudience("fitsupply-api").sign(key);
    const t1 = await sign(k1, "K1");
    const call = (token: string) => request(app).get("/cart/echo").set("Authorization", `Bearer ${token}`).set("x-user-id", "attacker").set("x-user-role", "ADMIN");
    const first = await call(t1).expect(200); expect(first.body).toMatchObject({ id: "verified-person", role: "CUSTOMER" });
    expect(first.headers["x-request-id"]).toBeTruthy(); expect(fetches).toBe(1);
    keys = [p1, p2]; vi.setSystemTime(Date.now() + 1100);
    const t2 = await sign(k2, "K2"); await call(t2).expect(200); await call(t1).expect(200); expect(fetches).toBe(2);
    for (let i = 0; i < 3; i++) await call(await sign(k2, `unknown${i}`)).expect(401);
    expect(fetches).toBe(2);
    fail = true; vi.setSystemTime(Date.now() + 1100); await call(t2).expect(200); expect(fetches).toBe(3);
    vi.setSystemTime(Date.now() + 1100);
    const unavailable = await call(t2).expect(503); expect(unavailable.text).not.toMatch(/127\.0\.0\.1|private|stack/);
    expect(unavailable.body.error.code).toBe("SERVICE_UNAVAILABLE");
    fail = false; keys = [p2]; vi.setSystemTime(Date.now() + 1100);
    await call(t2).expect(200); await call(t1).expect(401);
  });
});
