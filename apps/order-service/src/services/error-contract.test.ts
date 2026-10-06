import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createOrderService } from "./order.service.js";
import { logger } from "../logger.js";
import { createErrorHandler, correlationMiddleware, validCorrelationId } from "@shared/utils";
import express from "express";
import request from "supertest";

vi.mock("../config/index.js", async () => {
  const { loadConfig } = await import("../config/env.js");
  return { config: loadConfig({ DATABASE_URL: "postgresql://test:test@localhost/test_db", GATEWAY_SECRET: "test-secret" }) };
});
vi.mock("../config/db.js", () => ({ default: {} }));
const body = { items: [{ productId: "product-1", quantity: 1 }], delivery: { recipientName: "Test", contactPhone: "+3581234567", addressLine1: "Test street", addressLine2: undefined, city: "Helsinki", region: undefined, postalCode: "00100", countryCode: "FI" } };

describe("order downstream error contract", () => {
  beforeEach(() => { vi.spyOn(console, "info").mockImplementation(() => {}); vi.spyOn(console, "error").mockImplementation(() => {}); });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("reads catalog nested message, code and details while preserving status mapping", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { code: "PRODUCT_UNAVAILABLE", message: "Product unavailable", details: { productId: "product-1" } } }), { status: 409 })));
    await expect(createOrderService("user-1", body)).rejects.toMatchObject({ status: 400, code: "PRODUCT_UNAVAILABLE", message: "Product unavailable", details: { productId: "product-1" } });
  });

  it("handles non-JSON catalog failures safely", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("private upstream text", { status: 400 })));
    await expect(createOrderService("user-1", body)).rejects.toMatchObject({ status: 400, code: "BAD_REQUEST", message: "Downstream request failed" });
  });

  it("propagates trace and internal secret through existing catalog calls with a new hop ID", async () => {
    const fetch = vi.fn(async (_url: string, _init?: RequestInit) => new Response("{}", { status: 503 }));
    vi.stubGlobal("fetch", fetch);
    const app = express();
    app.use(correlationMiddleware("service"));
    app.post("/", async (_req, res) => res.json(await createOrderService("user-1", body)));
    app.use(createErrorHandler(logger));
    const traceId = "6a8eca39-843d-4864-bbba-bcdd32ac311d";
    const response = await request(app).post("/").set("x-trace-id", traceId);
    const headers = new Headers(fetch.mock.calls[0]?.[1]?.headers);
    expect(headers.get("x-trace-id")).toBe(traceId);
    expect(validCorrelationId(headers.get("x-request-id"))).toBe(true);
    expect(headers.get("x-request-id")).not.toBe(response.headers["x-request-id"]);
    expect(headers.get("x-internal-secret")).toBe("test-secret");
  });

  it("logs only safe downstream context, never upstream payload", async () => {
    const logged = vi.spyOn(logger, "debug").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { message: "Invalid", password: "upstream-secret" } }), { status: 400 })));
    await expect(createOrderService("user-1", body)).rejects.toMatchObject({ status: 400 });
    expect(logged).toHaveBeenCalledWith({ targetService: "catalog-service", operation: "GET /products/product-1", statusCode: 400 }, "downstream request rejected");
    expect(JSON.stringify(logged.mock.calls)).not.toContain("upstream-secret");
  });

  it.each(["network", "upstream"])("keeps %s internal failures out of public 503 details", async (kind) => {
    vi.stubGlobal("fetch", kind === "network"
      ? vi.fn().mockRejectedValue(new Error("private-network-credentials"))
      : vi.fn(async () => new Response(JSON.stringify({ error: { details: { password: "private-upstream-credentials" } } }), { status: 503 })));
    const app = express();
    app.post("/", async (_req, res) => res.json(await createOrderService("user-1", body)));
    app.use(createErrorHandler(logger));
    const response = await request(app).post("/");
    expect(response.status).toBe(503);
    expect(response.body.error.code).toBe("SERVICE_UNAVAILABLE");
    expect(JSON.stringify(response.body)).not.toMatch(/private-|http:\/\//);
    expect(response.body.error.details).toMatchObject({ targetService: "catalog-service", operation: "GET /products/product-1" });
  });
});
