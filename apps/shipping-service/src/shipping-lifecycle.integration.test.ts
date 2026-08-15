import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestError, ForbiddenError, cleanupDatabase, requireTestDatabaseUrl } from "@shared/utils";
import type { PrismaClient } from "./generated/prisma/index.js";
import type {
  createShipmentService as createShipmentServiceType,
  getMyShipmentsService as getMyShipmentsServiceType,
  getShipmentByIdService as getShipmentByIdServiceType,
  updateShipmentStatusService as updateShipmentStatusServiceType,
} from "./services/shipping.service.js";
import { createShipmentSchema } from "./validations/shipping.schema.js";

let prisma: PrismaClient;
let createShipmentService: typeof createShipmentServiceType;
let getMyShipmentsService: typeof getMyShipmentsServiceType;
let getShipmentByIdService: typeof getShipmentByIdServiceType;
let updateShipmentStatusService: typeof updateShipmentStatusServiceType;

const databaseUrl = requireTestDatabaseUrl("shipping_test_db");
const orderSnapshots = new Map<string, unknown>();
const notificationCalls: unknown[] = [];

const confirmedOrder = (overrides: Record<string, unknown> = {}) => ({
  id: "order-confirmed",
  userId: "user-a",
  status: "CONFIRMED",
  delivery: {
    recipientName: "Kim",
    contactPhone: "+358 40 1234567",
    addressLine1: "Aurakatu 1",
    addressLine2: "A 2",
    city: "Turku",
    region: null,
    postalCode: "20100",
    countryCode: "FI",
  },
  ...overrides,
});

beforeAll(async () => {
  process.env.DATABASE_URL = databaseUrl;
  process.env.GATEWAY_SECRET = "fitsupply_test_internal_secret";
  process.env.ORDER_SERVICE_URL = "http://order-service.test";
  process.env.NOTIFICATION_SERVICE_URL = "http://notification-service.test";

  const dbModule = await import("./config/db.js");
  prisma = dbModule.default;
  ({
    createShipmentService,
    getMyShipmentsService,
    getShipmentByIdService,
    updateShipmentStatusService,
  } = await import("./services/shipping.service.js"));
});

beforeEach(async () => {
  await cleanupDatabase("shipping_test_db", databaseUrl, { execute: async (sql) => { await prisma.$executeRawUnsafe(sql); } });
  orderSnapshots.clear();
  notificationCalls.length = 0;

  vi.stubGlobal("fetch", async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);

    if (url.includes("/internal/notifications")) {
      notificationCalls.push(JSON.parse(String(init?.body ?? "{}")));
      return new Response(JSON.stringify({ ok: true }), { status: 201 });
    }

    const match = url.match(/\/internal\/orders\/([^/]+)\/shipping-snapshot$/);
    if (match) {
      const order = orderSnapshots.get(match[1]);
      if (!order) {
        return new Response(JSON.stringify({ message: "Order not found" }), { status: 404 });
      }

      return new Response(JSON.stringify(order), { status: 200 });
    }

    return new Response(JSON.stringify({ message: "Unexpected request" }), { status: 500 });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("shipping lifecycle", () => {
  it("creates shipment from confirmed order snapshot and copies order owner", async () => {
    orderSnapshots.set("order-confirmed", confirmedOrder());

    const shipment = await createShipmentService("admin-user", { orderId: "order-confirmed" });

    expect(shipment).toMatchObject({
      orderId: "order-confirmed",
      userId: "user-a",
      status: "PROCESSING",
      recipientName: "Kim",
      phone: "+358 40 1234567",
      addressLine1: "Aurakatu 1",
      addressLine2: "A 2",
      city: "Turku",
      postalCode: "20100",
      country: "FI",
    });
  });

  it("rejects caller-supplied delivery snapshot fields", () => {
    expect(() =>
      createShipmentSchema.parse({
        orderId: "order-confirmed",
        userId: "attacker",
        recipientName: "Fake",
        addressLine1: "Fake Street",
      }),
    ).toThrow();
  });

  it("rejects non-confirmed orders", async () => {
    orderSnapshots.set("order-pending", confirmedOrder({ id: "order-pending", status: "PENDING" }));
    orderSnapshots.set("order-cancelled", confirmedOrder({ id: "order-cancelled", status: "CANCELLED" }));

    await expect(createShipmentService("admin-user", { orderId: "order-pending" })).rejects.toBeInstanceOf(BadRequestError);
    await expect(createShipmentService("admin-user", { orderId: "order-cancelled" })).rejects.toBeInstanceOf(BadRequestError);
  });

  it("returns existing shipment for repeated creation and keeps one row", async () => {
    orderSnapshots.set("order-confirmed", confirmedOrder());

    const first = await createShipmentService("admin-user", { orderId: "order-confirmed" });
    const second = await createShipmentService("admin-user", { orderId: "order-confirmed" });
    const count = await prisma.shipment.count({ where: { orderId: "order-confirmed" } });

    expect(second.id).toBe(first.id);
    expect(count).toBe(1);
  });

  it("handles concurrent duplicate creation with one shipment row", async () => {
    orderSnapshots.set("order-confirmed", confirmedOrder());

    const [first, second] = await Promise.all([
      createShipmentService("admin-user", { orderId: "order-confirmed" }),
      createShipmentService("admin-user", { orderId: "order-confirmed" }),
    ]);
    const count = await prisma.shipment.count({ where: { orderId: "order-confirmed" } });

    expect(first.id).toBe(second.id);
    expect(count).toBe(1);
  });

  it("keeps shipment ownership checks for customer reads", async () => {
    orderSnapshots.set("order-confirmed", confirmedOrder());
    const shipment = await createShipmentService("admin-user", { orderId: "order-confirmed" });

    await expect(getShipmentByIdService(shipment.id, "other-user")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getShipmentByIdService(shipment.id, "user-a")).resolves.toMatchObject({ id: shipment.id });

    const mine = await getMyShipmentsService("user-a");
    expect(mine).toHaveLength(1);
    expect(mine[0]?.id).toBe(shipment.id);
  });

  it("preserves status transitions and shipping notifications", async () => {
    orderSnapshots.set("order-confirmed", confirmedOrder());
    const shipment = await createShipmentService("admin-user", { orderId: "order-confirmed" });

    const shipped = await updateShipmentStatusService(shipment.id, "user-a", {
      status: "SHIPPED",
      trackingNumber: "TRACK-1",
    });
    const delivered = await updateShipmentStatusService(shipment.id, "user-a", { status: "DELIVERED" });

    expect(shipped.status).toBe("SHIPPED");
    expect(delivered.status).toBe("DELIVERED");
    expect(notificationCalls).toEqual([
      expect.objectContaining({ userId: "user-a", type: "ORDER_SHIPPED" }),
      expect.objectContaining({ userId: "user-a", type: "ORDER_DELIVERED" }),
    ]);
  });
});