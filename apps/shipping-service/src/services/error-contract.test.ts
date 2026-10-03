import { afterEach, describe, expect, it, vi } from "vitest";
import { createShipmentService } from "./shipping.service.js";

vi.mock("../config/db.js", () => ({ default: { shipment: { findFirst: vi.fn(async () => null) } } }));

describe("shipping downstream error contract", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("reads order nested message, code and details", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { code: "ORDER_MISSING", message: "Order absent", details: { orderId: "order-1" } } }), { status: 404 })));
    await expect(createShipmentService("user-1", { orderId: "order-1" })).rejects.toMatchObject({ status: 404, code: "ORDER_MISSING", message: "Order absent", details: { orderId: "order-1" } });
  });

  it("handles non-JSON order failures safely", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("private upstream text", { status: 400 })));
    await expect(createShipmentService("user-1", { orderId: "order-1" })).rejects.toMatchObject({ status: 400, code: "BAD_REQUEST", message: "Downstream request failed" });
  });
});
