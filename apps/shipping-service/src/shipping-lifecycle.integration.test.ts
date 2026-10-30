import { randomUUID } from "node:crypto";
import express from "express";
import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { BadRequestError, ForbiddenError, cleanupDatabase, requireTestDatabaseUrl, createGatewaySecretMiddleware, createErrorHandler,
  createLogger, dispatchOutboxOnce, openRabbitMq, readRabbitMqConfig, declareRabbitMqTopology, DOMAIN_EXCHANGE,
  deserializeIntegrationEvent, runWithCorrelation, traced, SpanKind, telemetryMetrics, type OutboxDatabase, type KnownIntegrationEvent } from "@shared/utils";
import type { PrismaClient } from "./generated/prisma/index.js";
import type {
  createShipmentService as createShipmentServiceType,
  getMyShipmentsService as getMyShipmentsServiceType,
  getShipmentByIdService as getShipmentByIdServiceType,
  updateShipmentStatusService as updateShipmentStatusServiceType,
} from "./services/shipping.service.js";
import { createShipmentSchema } from "./validations/shipping.schema.js";
import { registerShippingMetrics } from "./metrics.js";

let prisma: PrismaClient;
let createShipmentService: typeof createShipmentServiceType;
let getMyShipmentsService: typeof getMyShipmentsServiceType;
let getShipmentByIdService: typeof getShipmentByIdServiceType;
let updateShipmentStatusService: typeof updateShipmentStatusServiceType;
let closeDb: () => Promise<void>;
let app: express.Express;
const logger = createLogger({ service: "shipping-service", environment: "test", level: "silent" });
const orderId = "11111111-1111-4111-8111-111111111111";

const databaseUrl = requireTestDatabaseUrl("shipping_test_db");
const orderSnapshots = new Map<string, unknown>();
const notificationCalls: unknown[] = [];

const confirmedOrder = (overrides: Record<string, unknown> = {}) => ({
  id: "11111111-1111-4111-8111-111111111111",
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
  closeDb = dbModule.closeDb;
  ({
    createShipmentService,
    getMyShipmentsService,
    getShipmentByIdService,
    updateShipmentStatusService,
  } = await import("./services/shipping.service.js"));
  app = express(); app.use(express.json(), createGatewaySecretMiddleware("fitsupply_test_internal_secret"));
  app.use((await import("./middleware/user-context.middleware.js")).attachShippingUser);
  app.use((await import("./routes/shipping.route.js")).default, createErrorHandler(logger));
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
        return new Response(JSON.stringify({ error: { code: "NOT_FOUND", message: "Order not found" } }), { status: 404 });
      }

      return new Response(JSON.stringify(order), { status: 200 });
    }

    return new Response(JSON.stringify({ error: { code: "INTERNAL_ERROR", message: "Unexpected request" } }), { status: 500 });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});
afterAll(async () => { if (prisma) { await cleanupDatabase("shipping_test_db", databaseUrl, { execute: async (sql) => { await prisma.$executeRawUnsafe(sql); } }); await closeDb(); } });

describe("shipping lifecycle", () => {
  it("creates shipment from confirmed order snapshot and copies order owner", async () => {
    orderSnapshots.set("11111111-1111-4111-8111-111111111111", confirmedOrder());

    const shipment = await createShipmentService("admin-user", { orderId: "11111111-1111-4111-8111-111111111111" }, "ADMIN");

    expect(shipment).toMatchObject({
      orderId: "11111111-1111-4111-8111-111111111111",
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
        orderId: "11111111-1111-4111-8111-111111111111",
        userId: "attacker",
        recipientName: "Fake",
        addressLine1: "Fake Street",
      }),
    ).toThrow();
  });

  it("rejects non-confirmed orders", async () => {
    orderSnapshots.set("22222222-2222-4222-8222-222222222222", confirmedOrder({ id: "22222222-2222-4222-8222-222222222222", status: "PENDING" }));
    orderSnapshots.set("33333333-3333-4333-8333-333333333333", confirmedOrder({ id: "33333333-3333-4333-8333-333333333333", status: "CANCELLED" }));

    await expect(createShipmentService("admin-user", { orderId: "22222222-2222-4222-8222-222222222222" }, "ADMIN")).rejects.toBeInstanceOf(BadRequestError);
    await expect(createShipmentService("admin-user", { orderId: "33333333-3333-4333-8333-333333333333" }, "ADMIN")).rejects.toBeInstanceOf(BadRequestError);
  });

  it("returns existing shipment for repeated creation and keeps one row", async () => {
    orderSnapshots.set("11111111-1111-4111-8111-111111111111", confirmedOrder());

    const first = await createShipmentService("admin-user", { orderId: "11111111-1111-4111-8111-111111111111" }, "ADMIN");
    const second = await createShipmentService("admin-user", { orderId: "11111111-1111-4111-8111-111111111111" }, "ADMIN");
    const count = await prisma.shipment.count({ where: { orderId: "11111111-1111-4111-8111-111111111111" } });

    expect(second.id).toBe(first.id);
    expect(count).toBe(1);
  });

  it("handles concurrent duplicate creation with one shipment row", async () => {
    orderSnapshots.set("11111111-1111-4111-8111-111111111111", confirmedOrder());

    const [first, second] = await Promise.all([
      createShipmentService("admin-user", { orderId: "11111111-1111-4111-8111-111111111111" }, "ADMIN"),
      createShipmentService("admin-user", { orderId: "11111111-1111-4111-8111-111111111111" }, "ADMIN"),
    ]);
    const count = await prisma.shipment.count({ where: { orderId: "11111111-1111-4111-8111-111111111111" } });

    expect(first.id).toBe(second.id);
    expect(count).toBe(1);
  });

  it("keeps shipment ownership checks for customer reads", async () => {
    orderSnapshots.set("11111111-1111-4111-8111-111111111111", confirmedOrder());
    const shipment = await createShipmentService("admin-user", { orderId: "11111111-1111-4111-8111-111111111111" }, "ADMIN");

    await expect(getShipmentByIdService(shipment.id, "other-user")).rejects.toBeInstanceOf(ForbiddenError);
    await expect(getShipmentByIdService(shipment.id, "user-a")).resolves.toMatchObject({ id: shipment.id });

    const mine = await getMyShipmentsService("user-a");
    expect(mine).toHaveLength(1);
    expect(mine[0]?.id).toBe(shipment.id);
  });

  it("preserves status transitions and shipping notifications", async () => {
    orderSnapshots.set("11111111-1111-4111-8111-111111111111", confirmedOrder());
    const shipment = await createShipmentService("admin-user", { orderId: "11111111-1111-4111-8111-111111111111" }, "ADMIN");

    orderSnapshots.set("11111111-1111-4111-8111-111111111111", confirmedOrder({ status: "PROCESSING" }));
    const shipped = await updateShipmentStatusService(shipment.id, "user-a", {
      status: "SHIPPED",
      trackingNumber: "TRACK-1",
    }, "ADMIN");
    const delivered = await updateShipmentStatusService(shipment.id, "admin-user", { status: "DELIVERED" }, "ADMIN");

    expect(shipped.status).toBe("SHIPPED");
    expect(delivered.status).toBe("DELIVERED");
    expect(notificationCalls).toEqual([]);
    const facts = await prisma.outboxEvent.findMany({ orderBy: { createdAt: "asc" } });
    expect(facts.map((row) => JSON.parse(row.payload).eventType)).toEqual(["shipment.shipped", "shipment.delivered"]);
  });
});

async function shipment() {
  orderSnapshots.set(orderId, confirmedOrder());
  const value = await createShipmentService("admin-user", { orderId }, "ADMIN");
  orderSnapshots.set(orderId, confirmedOrder({ status: "PROCESSING" }));
  return value;
}

it("requires admin inside service/API; customer identity cannot supply mutation authority", async () => {
  orderSnapshots.set(orderId, confirmedOrder());
  await expect(createShipmentService("user-a", { orderId }, "CUSTOMER")).rejects.toMatchObject({ status: 403 });
  await request(app).post("/shipments").send({ orderId }).expect(403);
  await request(app).post("/shipments").set("x-internal-secret", "fitsupply_test_internal_secret").set("x-user-id", "user-a").set("x-user-role", "CUSTOMER").send({ orderId }).expect(403);
  const row = await shipment();
  await expect(updateShipmentStatusService(row.id, "user-a", { status: "SHIPPED", trackingNumber: "FORGED" }, "CUSTOMER")).rejects.toMatchObject({ status: 403 });
  await request(app).patch(`/shipments/${row.id}/status`).set("x-internal-secret", "fitsupply_test_internal_secret").set("x-user-id", "user-a").set("x-user-role", "CUSTOMER").send({ status: "SHIPPED", trackingNumber: "FORGED", role: "ADMIN" }).expect(403);
  expect(await prisma.shipment.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({ status: "PROCESSING", trackingNumber: null });
});

it("dispatch rejects still-cancellable/cancelled Orders without shipment or Outbox mutation", async () => {
  const row = await shipment();
  for (const status of ["CONFIRMED", "CANCELLED"]) {
    orderSnapshots.set(orderId, confirmedOrder({ status }));
    await expect(updateShipmentStatusService(row.id, "admin-user", { status: "SHIPPED", trackingNumber: "MANUAL-1" }, "ADMIN")).rejects.toMatchObject({ status: 400 });
  }
  expect(await prisma.outboxEvent.count()).toBe(0);
  expect(await prisma.shipment.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({ status: "PROCESSING", trackingNumber: null });
});

it("concurrent duplicate shipped commands create one durable event and pin unique tracking", async () => {
  const row = await shipment();
  const command = () => updateShipmentStatusService(row.id, "admin-user", { status: "SHIPPED", trackingNumber: "MANUAL-1" }, "ADMIN");
  const results = await Promise.all([command(), command(), command()]);
  expect(results.every((value) => value.status === "SHIPPED")).toBe(true);
  expect(await prisma.outboxEvent.count()).toBe(1);
  await expect(updateShipmentStatusService(row.id, "admin-user", { status: "SHIPPED", trackingNumber: "IMPERSONATED" }, "ADMIN")).rejects.toMatchObject({ status: 409 });
  await expect(prisma.shipment.create({ data: { orderId: randomUUID(), userId: "other", recipientName: "Other", phone: "1", addressLine1: "Street", city: "City", postalCode: "1", country: "FI", trackingNumber: "MANUAL-1" } })).rejects.toMatchObject({ code: "P2002" });
});

it("concurrent stale updates cannot move DELIVERED back to SHIPPED", async () => {
  const row = await shipment();
  let entered!: () => void; let release!: () => void;
  const locked = new Promise<void>((resolve) => { entered = resolve; });
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  const blocker = prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Shipment" WHERE "id"=${row.id} FOR UPDATE`;
    entered(); await barrier;
  });
  await locked;
  const work = Promise.allSettled([
    updateShipmentStatusService(row.id, "admin-user", { status: "SHIPPED", trackingNumber: "MANUAL-1" }, "ADMIN"),
    updateShipmentStatusService(row.id, "admin-user", { status: "DELIVERED", trackingNumber: "MANUAL-1" }, "ADMIN"),
  ]);
  try {
    await vi.waitFor(async () => {
      const [waiters] = await prisma.$queryRaw<Array<{ total: bigint }>>`SELECT COUNT(*) AS total FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock'`;
      expect(Number(waiters.total)).toBeGreaterThanOrEqual(2);
    }, { timeout: 2000, interval: 20 });
  } finally { release(); await blocker; }
  const results = await work;
  expect(results[1].status).toBe("fulfilled");
  if (results[0].status === "rejected") expect(results[0].reason).toMatchObject({ status: 400 });
  expect(await prisma.shipment.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({ status: "DELIVERED" });
  await updateShipmentStatusService(row.id, "admin-user", { status: "DELIVERED" }, "ADMIN");
  expect(await prisma.outboxEvent.count({ where: { deduplicationKey: `shipment:${row.id}:DELIVERED` } })).toBe(1);
});

it("Outbox failure rolls back tracking/state and retry commits one canonical event with trace", async () => {
  const row = await shipment();
  await prisma.$executeRawUnsafe(`CREATE FUNCTION fail_shipping_outbox() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test shipping rollback'; END $$`);
  try {
    await prisma.$executeRawUnsafe(`CREATE TRIGGER fail_shipping_outbox BEFORE INSERT ON "OutboxEvent" FOR EACH ROW EXECUTE FUNCTION fail_shipping_outbox()`);
    await expect(updateShipmentStatusService(row.id, "admin-user", { status: "SHIPPED", trackingNumber: "MANUAL-1" }, "ADMIN")).rejects.toThrow();
    expect(await prisma.shipment.findUniqueOrThrow({ where: { id: row.id } })).toMatchObject({ status: "PROCESSING", trackingNumber: null });
    expect(await prisma.outboxEvent.count()).toBe(0);
  } finally {
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS fail_shipping_outbox ON "OutboxEvent"`);
    await prisma.$executeRawUnsafe(`DROP FUNCTION fail_shipping_outbox()`);
  }
  const correlationId = randomUUID();
  await runWithCorrelation({ requestId: randomUUID(), traceId: correlationId }, () => traced("shipping test", SpanKind.INTERNAL, {}, () =>
    updateShipmentStatusService(row.id, "admin-user", { status: "SHIPPED", trackingNumber: "MANUAL-1" }, "ADMIN")));
  const fact = await prisma.outboxEvent.findFirstOrThrow();
  expect(fact.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  expect(JSON.parse(fact.payload)).toMatchObject({ eventType: "shipment.shipped", eventVersion: 1, correlationId, causationId: null,
    producer: { service: "shipping-service" }, data: { shipmentId: row.id, orderId, userId: "user-a" } });
});

it("broker confirm before marker rollback republishes same fact after restart safely", async () => {
  const row = await shipment();
  await updateShipmentStatusService(row.id, "admin-user", { status: "SHIPPED", trackingNumber: "MANUAL-1" }, "ADMIN");
  const config = readRabbitMqConfig(); const endpoint = new URL(config.url);
  if (endpoint.hostname !== "localhost" || endpoint.port !== "5673" || endpoint.username !== "fitsupply_test") throw new Error("Shipping tests require disposable broker");
  const broker = await openRabbitMq(config, logger);
  try {
    const channel = await broker.createChannel(); await declareRabbitMqTopology(channel);
    const queue = (await channel.assertQueue("", { exclusive: true, autoDelete: true })).queue;
    await channel.bindQueue(queue, DOMAIN_EXCHANGE, "shipment.*");
    const publisher = await broker.createPublisher();
    const publish = (event: KnownIntegrationEvent) => publisher.publish(DOMAIN_EXCHANGE, event.eventType, Buffer.from(JSON.stringify(event)));
    const crash: OutboxDatabase = { $transaction: (work, options) => prisma.$transaction(async (tx) => { await work(tx); throw new Error("crash after confirm"); }, options) };
    await expect(dispatchOutboxOnce(crash, publish, logger)).rejects.toThrow("crash after confirm");
    expect(await prisma.outboxEvent.findFirstOrThrow()).toMatchObject({ publishedAt: null });
    await dispatchOutboxOnce(prisma, publish, logger);
    const events: KnownIntegrationEvent[] = [];
    await vi.waitFor(async () => {
      const message = await channel.get(queue, { noAck: true });
      if (message) events.push(deserializeIntegrationEvent(message.content));
      expect(events).toHaveLength(2);
    }, { timeout: 5000, interval: 20 });
    expect(new Set(events.map((event) => event.eventId)).size).toBe(1);
    expect(await prisma.outboxEvent.findFirstOrThrow()).toMatchObject({ publishedAt: expect.any(Date) });
  } finally { await broker.close(); }
});

it("persisted Shipping metrics expose committed events and delayed backlog without IDs", async () => {
  registerShippingMetrics(prisma);
  const row = await shipment();
  await updateShipmentStatusService(row.id, "admin-user", { status: "SHIPPED", trackingNumber: "MANUAL-1" }, "ADMIN");
  await prisma.outboxEvent.updateMany({ data: { nextAttemptAt: new Date(Date.now() + 60000) } });
  const metrics = await telemetryMetrics();
  expect(metrics).toMatch(/shipments_created_total\{[^\n]*\} 1/);
  expect(metrics).toMatch(/outbox_pending_total\{[^\n]*\} 1/);
  expect(metrics).toContain('event_type="shipment.shipped"');
  expect(metrics).not.toContain(row.id);
  expect(metrics).not.toContain("MANUAL-1");
});
