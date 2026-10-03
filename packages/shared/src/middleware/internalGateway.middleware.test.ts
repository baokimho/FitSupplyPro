import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createGatewaySecretMiddleware } from "./internalGateway.middleware.js";

describe("configured internal secret middleware", () => {
  it("enforces supplied secret with unchanged forbidden envelope", async () => {
    const app = express();
    app.use(createGatewaySecretMiddleware("configured-secret"));
    app.get("/", (_req, res) => res.json({ ok: true }));
    for (const secret of [undefined, "wrong-secret"]) {
      const call = request(app).get("/");
      if (secret) call.set("x-internal-secret", secret);
      const response = await call;
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: { code: "FORBIDDEN", message: "Forbidden" } });
    }
    await request(app).get("/").set("x-internal-secret", "configured-secret").expect(200, { ok: true });
  });

  it("preserves legacy missing-secret error", async () => {
    const app = express();
    app.use(createGatewaySecretMiddleware(undefined));
    const response = await request(app).get("/");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: { code: "INTERNAL_ERROR", message: "GATEWAY_SECRET is not set" } });
  });
});
