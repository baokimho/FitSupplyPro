import { describe, expect, it, vi } from "vitest";
import { Prisma } from "../generated/prisma/index.js";
import { getOrderPaymentSnapshotService } from "./order.service.js";

const database = vi.hoisted(() => ({ order: { findUnique: vi.fn() } }));
vi.mock("../config/db.js", () => ({ default: database }));
vi.mock("../config/index.js", async () => {
  const { loadConfig } = await import("../config/env.js");
  return { config: loadConfig({ DATABASE_URL: "postgresql://test:test@localhost/test_db", GATEWAY_SECRET: "test-secret" }) };
});

describe("authoritative Order payment snapshot", () => {
  it("returns exact decimal money and pending command without delivery dependencies", async () => {
    database.order.findUnique.mockResolvedValue({
      id: "order-1", userId: "user-1", status: "PENDING", pendingStatus: "CANCELLED",
      totalAmount: new Prisma.Decimal("99999999.99"), items: [],
    });
    await expect(getOrderPaymentSnapshotService("order-1")).resolves.toEqual({
      id: "order-1", userId: "user-1", status: "PENDING", pendingStatus: "CANCELLED",
      totalAmount: "99999999.99", currency: "USD",
    });
  });

  it("rejects missing Order", async () => {
    database.order.findUnique.mockResolvedValue(null);
    await expect(getOrderPaymentSnapshotService("missing")).rejects.toMatchObject({ status: 404 });
  });
});
