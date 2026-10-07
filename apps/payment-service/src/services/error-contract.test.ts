import { afterEach, describe, expect, it, vi } from "vitest";
import { createPaymentService } from "./payment.service.js";

vi.mock("../config/index.js", async () => {
  const { loadConfig } = await import("../config/env.js");
  return { config: loadConfig({ DATABASE_URL: "postgresql://test:test@localhost/test_db", GATEWAY_SECRET: "test-secret" }) };
});
vi.mock("../config/db.js", () => {
  const transaction = {
    $queryRaw: vi.fn(async () => []),
    paymentIdempotency: { findUnique: vi.fn(async () => null) },
    payment: { findFirst: vi.fn(async () => null) },
  };
  return { default: { $transaction: vi.fn(async (callback: (tx: typeof transaction) => Promise<unknown>) => callback(transaction)) } };
});

describe("payment downstream error contract", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads order nested message, code and details", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { code: "ORDER_MISSING", message: "Order absent", details: { orderId: "order-1" } } }), { status: 404 })));
    await expect(createPaymentService("user-1", { orderId: "order-1" }, "key-1")).rejects.toMatchObject({ status: 404, code: "ORDER_MISSING", message: "Order absent", details: { orderId: "order-1" } });
  });

  it("handles non-JSON order failures safely", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("private upstream text", { status: 400 })));
    await expect(createPaymentService("user-1", { orderId: "order-1" }, "key-1")).rejects.toMatchObject({ status: 400, code: "BAD_REQUEST", message: "Downstream request failed" });
  });
});
