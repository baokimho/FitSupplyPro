import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPaymentService } from "./payment.service.js";

vi.mock("../config/db.js", () => ({ default: {
  $queryRaw: vi.fn(async () => [{ id: "attempt-1", requestFingerprint: createHash("sha256").update(JSON.stringify({ orderId: "order-1" })).digest("hex") }]),
  $executeRaw: vi.fn(async () => 1),
} }));

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
