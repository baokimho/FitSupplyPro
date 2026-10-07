import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "../generated/prisma/index.js";
import { createOrderService } from "./order.service.js";
import { logger } from "../logger.js";
import express from "express";
import request from "supertest";
import { correlationMiddleware, createErrorHandler, validCorrelationId } from "@shared/utils";

const database = vi.hoisted(() => ({ $transaction: vi.fn() }));
vi.mock("../config/db.js", () => ({ default: database }));
vi.mock("../config/index.js", async () => {
  const { loadConfig } = await import("../config/env.js");
  return { config: loadConfig({ DATABASE_URL: "postgresql://test:test@localhost/test_db", GATEWAY_SECRET: "test-secret" }) };
});

const body = { items: [{ productId: "A", quantity: 2 }, { productId: "B", quantity: 3 }],
  delivery: { recipientName: "Test", contactPhone: "+3581234567", addressLine1: "Street 1",
    addressLine2: undefined, city: "Helsinki", region: undefined, postalCode: "00100", countryCode: "FI" } };

const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
let actions: string[];
let releaseFailures: Set<string>;
let reserveFailure: string | undefined;
let catalogFailure: boolean;

beforeEach(() => {
  actions = [];
  releaseFailures = new Set();
  reserveFailure = undefined;
  catalogFailure = false;
  vi.spyOn(logger, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
    const productId = url.split("/products/")[1]?.split("/")[0];
    if (url.endsWith("/products/batch")) return json({ items: ["A", "B"].map((id) => ({ productId: id, availableStock: 100 })) });
    if (url.endsWith("/reserve")) {
      actions.push(`reserve:${productId}`);
      return productId === reserveFailure ? json({ error: { message: "Insufficient stock" } }, 400) : json({});
    }
    if (url.endsWith("/release")) {
      actions.push(`release:${productId}`);
      return releaseFailures.has(productId) ? json({}, 503) : json({});
    }
    if (url.includes("/internal/notifications")) return json({});
    if (!init?.method) {
      if (catalogFailure) throw new Error("private connection failure");
      return json({ data: { id: productId, name: `Name ${productId}`, slug: `slug-${productId}`, price: "0.10", isPublished: true } });
    }
    throw new Error("Unexpected request");
  }));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); database.$transaction.mockReset(); });

describe("creation failure boundaries", () => {
  it("propagates correlation to Catalog, reserve and compensation with safe public DB error", async () => {
    database.$transaction.mockRejectedValue(new Error("private DB failure"));
    const app = express();
    app.use(correlationMiddleware("service"));
    app.post("/", async (_req, res) => res.json(await createOrderService("user-1", body)));
    app.use(createErrorHandler(logger));
    const traceId = "6a8eca39-843d-4864-bbba-bcdd32ac311d";
    const response = await request(app).post("/").set("x-trace-id", traceId).expect(500);
    expect(response.body).toEqual({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
    for (const call of vi.mocked(globalThis.fetch).mock.calls) {
      const headers = new Headers(call[1]?.headers);
      expect(headers.get("x-trace-id")).toBe(traceId);
      expect(validCorrelationId(headers.get("x-request-id"))).toBe(true);
      expect(headers.get("x-request-id")).not.toBe(response.headers["x-request-id"]);
      expect(headers.get("x-internal-secret")).toBe("test-secret");
    }
    expect(actions).toEqual(["reserve:A", "reserve:B", "release:B", "release:A"]);
  });
  it("preserves original DB error and attempts every compensation despite release failure", async () => {
    const original = new Error("private database failure");
    database.$transaction.mockRejectedValue(original);
    releaseFailures.add("B");
    await expect(createOrderService("user-1", body)).rejects.toBe(original);
    expect(actions).toEqual(["reserve:A", "reserve:B", "release:B", "release:A"]);
    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ originalError: original, productId: "B", quantity: 3,
      userId: "user-1", operation: "create-order-compensation", reservationId: expect.any(String) }), "inventory compensation failed");
  });

  it("compensates prior reserve if later reserve fails, without local persistence", async () => {
    reserveFailure = "B";
    await expect(createOrderService("user-1", body)).rejects.toMatchObject({ status: 400, message: "Insufficient stock" });
    expect(database.$transaction).not.toHaveBeenCalled();
    expect(actions).toEqual(["reserve:A", "reserve:B", "release:A"]);
  });

  it("Catalog connection failure cannot reserve or persist", async () => {
    catalogFailure = true;
    await expect(createOrderService("user-1", body)).rejects.toMatchObject({ status: 503 });
    expect(actions).toEqual([]);
    expect(database.$transaction).not.toHaveBeenCalled();
  });

  it("validates service callers including cart-derived quantities before any downstream effects", async () => {
    await expect(createOrderService("user-1", { ...body, items: [{ productId: "A", quantity: NaN }] })).rejects.toThrow();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("persists authoritative Decimal snapshots in one local transaction", async () => {
    const create = vi.fn(async ({ data }: { data: { userId: string; totalAmount: Prisma.Decimal; items: { create: Array<{ productId: string; quantity: number; unitPrice: Prisma.Decimal; subtotal: Prisma.Decimal }> } } }) => ({
      ...data, id: "order-1", status: "PENDING", items: data.items.create.map((item) => ({ ...item, id: item.productId })),
    }));
    database.$transaction.mockImplementation(async (callback) => callback({ order: { create }, $executeRaw: vi.fn() }));
    const order = await createOrderService("user-1", body);
    expect(order.totalAmount).toBe(0.5);
    const data = create.mock.calls[0][0].data;
    expect(data.totalAmount.toFixed(2)).toBe("0.50");
    expect(data.items.create.map((item) => item.subtotal.toFixed(2))).toEqual(["0.20", "0.30"]);
    expect(data.items.create[0]).toMatchObject({ productName: "Name A", productSlug: "slug-A" });
    expect(database.$transaction).toHaveBeenCalledTimes(1);
  });
});
