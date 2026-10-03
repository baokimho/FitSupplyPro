import express, { type Request, type Response } from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Options } from "http-proxy-middleware";
import { errorHandler } from "@shared/utils";
import { authMiddleware } from "./middleware/auth.middleware.js";
import { authLimiter } from "./middleware/rateLimit.middleware.js";

const mocks = vi.hoisted(() => ({ configs: [] as Array<Options<Request, Response>>, verify: vi.fn(), key: vi.fn() }));
vi.mock("@shared/utils", async (importOriginal) => ({ ...await importOriginal<typeof import("@shared/utils")>(), verifyAuthToken: mocks.verify, getPublicKey: mocks.key }));
vi.mock("http-proxy-middleware", () => ({ createProxyMiddleware: (config: Options<Request, Response>) => { mocks.configs.push(config); return vi.fn(); } }));
import "./proxy/authProxy.proxy.js";
import "./proxy/cartProxy.proxy.js";
import "./proxy/catalogProxy.proxy.js";
import "./proxy/inventoryProxy.proxy.js";
import "./proxy/notificationProxy.proxy.js";
import "./proxy/orderProxy.proxy.js";
import "./proxy/paymentProxy.proxy.js";
import "./proxy/shippingProxy.proxy.js";

describe("gateway direct error envelopes", () => {
  afterEach(() => vi.clearAllMocks());

  it.each(["missing", "invalid-claims"])("keeps %s authentication failure nested", async (kind) => {
    mocks.verify.mockResolvedValue({ sub: "user-1" });
    const app = express();
    app.get("/", authMiddleware, (_req, res) => res.json({ ok: true }));
    app.use(errorHandler);
    const call = request(app).get("/");
    if (kind === "invalid-claims") call.set("Authorization", "Bearer token");
    const response = await call;
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: { code: "UNAUTHORIZED", message: kind === "missing" ? "Missing token" : "Invalid token" } });
  });

  it("keeps rate-limit failure nested", async () => {
    const app = express();
    app.get("/", authLimiter, (_req, res) => res.json({ ok: true }));
    for (let i = 0; i < 5; i++) await request(app).get("/").expect(200);
    const response = await request(app).get("/");
    expect(response.status).toBe(429);
    expect(response.body).toEqual({ error: { code: "TOO_MANY_REQUESTS", message: "Too many requests" } });
  });

  it("keeps all eight proxy-failure responses nested", () => {
    expect(mocks.configs).toHaveLength(8);
    for (const config of mocks.configs) {
      const res = { headersSent: false, status: vi.fn(), json: vi.fn() };
      res.status.mockReturnValue(res);
      expect(config.on?.error).toBeTypeOf("function");
      config.on?.error?.(new Error("private proxy failure"), {} as Request, res as unknown as Response);
      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.json).toHaveBeenCalledWith({ error: { code: "SERVICE_UNAVAILABLE", message: "Service unavailable" } });
    }
  });
});
