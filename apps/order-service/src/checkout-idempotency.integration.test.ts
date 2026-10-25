import express from "express";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { createIntegrationEvent, runWithCorrelation, dispatchOutboxOnce, startOutboxPublisher, processCheckoutEvent, createLogger } from "@shared/utils";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupDatabase, getCleanupTables, errorHandler, requireTestDatabaseUrl } from "@shared/utils";
import { enqueueOutboxEvent, registerCheckoutMetrics, telemetryMetrics, traced, SpanKind, activeTraceFields } from "@shared/utils";
import type { PrismaClient } from "./generated/prisma/index.js";
import type { cancelOrderService as cancelOrderServiceType, checkoutOrderService as checkoutOrderServiceType, confirmOrderService as confirmOrderServiceType, createOrderService as createOrderServiceType } from "./services/order.service.js";
import type { advanceOrderService as advanceOrderServiceType } from "./services/order.service.js";

let prisma: PrismaClient;
let cancelOrderService: typeof cancelOrderServiceType;
let checkoutOrderService: typeof checkoutOrderServiceType;
let confirmOrderService: typeof confirmOrderServiceType;
let createOrderService: typeof createOrderServiceType;
let advanceOrderService: typeof advanceOrderServiceType;
let app: express.Express;

const databaseUrl = requireTestDatabaseUrl("order_test_db");
const originalFetch = globalThis.fetch;

type Product = {
  id: string;
  name: string;
  slug: string;
  price: string;
  isPublished: boolean;
};

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
};

const products = new Map<string, Product>();
let cartItems: CartItem[] = [];
let cartVersion = 1;
let reserveCalls: Array<{ productId: string; quantity: number }> = [];
let removeCalls: string[][] = [];
let releaseCalls: Array<{ productId: string; quantity: number }> = [];
let consumeCalls: Array<{ productId: string; quantity: number }> = [];
const failReserveProducts = new Set<string>();
const failReleaseProducts = new Set<string>();
const failConsumeProducts = new Set<string>();
const inventoryOperations = new Map<string, { productId: string; action: string; quantity: number }>();
const inventory = new Map<string, { stock: number; reservedStock: number }>();
let reserveDelayMs = 0;

const defaultDelivery = () => ({
  recipientName: "Ada Lovelace",
  contactPhone: "+358 40 123 4567",
  addressLine1: "Testikatu 1",
  addressLine2: "A 2",
  city: "Helsinki",
  region: "Uusimaa",
  postalCode: "00100",
  countryCode: "FI",
});

const checkoutBody = (cartItemIds: string[], delivery = defaultDelivery()) => ({ cartItemIds, delivery });

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

function setProduct(product: Product) {
  products.set(product.id, product);
}

function setInventory(productId: string, stock: number, reservedStock = 0) {
  inventory.set(productId, { stock, reservedStock });
}

function setCart(items: CartItem[]) {
  cartItems = items;
}

function reserveCount(productId: string) {
  return reserveCalls.filter((call) => call.productId === productId).length;
}

async function countOrders() {
  return prisma.order.count();
}

async function truncateOrderDb() {
  await cleanupDatabase("order_test_db", databaseUrl, { execute: async (sql) => { await prisma.$executeRawUnsafe(sql); } });
}

function installFetchDouble() {
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.includes("/internal/cart") && method === "GET") {
      return jsonResponse({ id: "cart-1", userId: "user-1", version: cartVersion, items: cartItems });
    }

    if (url.includes("/internal/cart/items") && method === "DELETE") {
      const body = JSON.parse(String(init?.body ?? "{}")) as { cartItemIds?: string[]; cartId?: string; cartVersion?: number };
      if (body.cartId && (body.cartId !== "cart-1" || body.cartVersion !== cartVersion)) {
        return jsonResponse({ error: { code: "CONFLICT", message: "Cart changed during checkout" } }, 409);
      }
      removeCalls.push(body.cartItemIds ?? []);
      cartItems = cartItems.filter((item) => !(body.cartItemIds ?? []).includes(item.id));
      cartVersion += 1;
      return jsonResponse({});
    }

    if (url.includes("/products/batch") && method === "POST") {
      const body = JSON.parse(String(init?.body ?? "{}")) as { productIds?: string[] };
      const items = (body.productIds ?? []).flatMap((productId) => {
        const current = inventory.get(productId);
        if (!current) return [];
        return [{
          productId,
          stock: current.stock,
          reservedStock: current.reservedStock,
          availableStock: current.stock - current.reservedStock,
        }];
      });
      return jsonResponse({ items });
    }

    if (url.includes("/reserve") && method === "POST") {
      const match = url.match(/\/products\/([^/]+)\/reserve/);
      const productId = match?.[1] ?? "";
      const body = JSON.parse(String(init?.body ?? "{}")) as { quantity: number; operationId?: string };
      if (body.operationId && inventoryOperations.has(body.operationId)) return jsonResponse({});
      if (reserveDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, reserveDelayMs));
      }
      const current = inventory.get(productId);
      if (failReserveProducts.has(productId) || !current || current.stock - current.reservedStock < body.quantity) {
        return jsonResponse({ error: { code: "BAD_REQUEST", message: "Insufficient stock" } }, 400);
      }
      current.reservedStock += body.quantity;
      if (body.operationId) inventoryOperations.set(body.operationId, { productId, action: "RESERVE", quantity: body.quantity });
      reserveCalls.push({ productId, quantity: body.quantity });
      return jsonResponse({});
    }

    if (url.includes("/release") && method === "POST") {
      const match = url.match(/\/products\/([^/]+)\/release/);
      const productId = match?.[1] ?? "";
      const body = JSON.parse(String(init?.body ?? "{}")) as { quantity: number; operationId?: string };
      if (body.operationId && inventoryOperations.has(body.operationId)) return jsonResponse({});
      if (failReleaseProducts.has(productId)) {
        return jsonResponse({ error: { code: "INTERNAL_ERROR", message: "release failed" } }, 500);
      }
      const current = inventory.get(productId);
      if (!current || current.reservedStock < body.quantity) return jsonResponse({ error: { code: "BAD_REQUEST", message: "Reserved stock is insufficient" } }, 400);
      current.reservedStock -= body.quantity;
      if (body.operationId) inventoryOperations.set(body.operationId, { productId, action: "RELEASE", quantity: body.quantity });
      releaseCalls.push({ productId, quantity: body.quantity });
      return jsonResponse({});
    }

    if (url.includes("/consume") && method === "POST") {
      const match = url.match(/\/products\/([^/]+)\/consume/);
      const productId = match?.[1] ?? "";
      const body = JSON.parse(String(init?.body ?? "{}")) as { quantity: number; operationId?: string };
      const existing = body.operationId ? inventoryOperations.get(body.operationId) : undefined;
      if (existing) {
        if (existing.productId !== productId || existing.action !== "CONSUME" || existing.quantity !== body.quantity) {
          return jsonResponse({ error: { code: "CONFLICT", message: "Inventory operation id was reused with different input" } }, 409);
        }
        return jsonResponse({});
      }
      if (failConsumeProducts.has(productId)) {
        return jsonResponse({ error: { code: "INTERNAL_ERROR", message: "consume failed" } }, 500);
      }
      const current = inventory.get(productId);
      if (!current || current.reservedStock < body.quantity || current.stock < body.quantity) {
        return jsonResponse({ error: { code: "BAD_REQUEST", message: "Reserved stock is insufficient" } }, 400);
      }
      if (body.operationId) {
        inventoryOperations.set(body.operationId, { productId, action: "CONSUME", quantity: body.quantity });
      }
      current.stock -= body.quantity;
      current.reservedStock -= body.quantity;
      consumeCalls.push({ productId, quantity: body.quantity });
      return jsonResponse({});
    }
    const productMatch = url.match(/\/products\/([^/]+)$/);
    if (productMatch && method === "GET") {
      const product = products.get(productMatch[1]);
      if (!product) return jsonResponse({ error: { code: "BAD_REQUEST", message: "Product not found" } }, 400);
      return jsonResponse({ success: true, data: product });
    }

    if (url.includes("/internal/notifications")) {
      return jsonResponse({});
    }

    return jsonResponse({ error: { code: "INTERNAL_ERROR", message: `Unhandled request: ${method} ${url}` } }, 500);
  }));
}

beforeAll(async () => {
  process.env.DATABASE_URL = databaseUrl;
  process.env.GATEWAY_SECRET = "fitsupply_test_internal_secret";
  process.env.CART_SERVICE_URL = "http://cart-service.test";
  process.env.CATALOG_SERVICE_URL = "http://catalog-service.test";
  process.env.INVENTORY_SERVICE_URL = "http://inventory-service.test";
  process.env.NOTIFICATION_SERVICE_URL = "http://notification-service.test";

  installFetchDouble();
  const dbModule = await import("./config/db.js");
  prisma = dbModule.default;
  ({ cancelOrderService, checkoutOrderService, confirmOrderService, createOrderService, advanceOrderService } = await import("./services/order.service.js"));

  const routes = (await import("./routes/order.route.js")).default;
  app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.orderUser = { id: req.get("x-test-user-id") ?? "user-1", role: req.get("x-test-user-role") ?? "CUSTOMER" };
    next();
  });
  app.use(routes);
  app.use(errorHandler);
});

beforeEach(async () => {
  await truncateOrderDb();
  products.clear();
  inventory.clear();
  reserveCalls = [];
  removeCalls = [];
  releaseCalls = [];
  consumeCalls = [];
  failReserveProducts.clear();
  failReleaseProducts.clear();
  failConsumeProducts.clear();
  inventoryOperations.clear();
  reserveDelayMs = 0;
  setProduct({ id: "product-1", name: "Protein", slug: "protein", price: "10.00", isPublished: true });
  setProduct({ id: "product-2", name: "Creatine", slug: "creatine", price: "12.00", isPublished: true });
  setInventory("product-1", 10);
  setInventory("product-2", 10);
  cartVersion = 1;
  setCart([{ id: "cart-item-1", productId: "product-1", quantity: 2 }]);
});

describe("bounded synchronous dependency recovery", () => {
  it("retries transient Catalog read with stable trace, then completes and replays one checkout", async () => {
    const delegate = globalThis.fetch;
    const traces: Array<string | null> = [];
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      if (String(input).includes("catalog-service")) {
        traces.push(new Headers(init?.headers).get("x-trace-id"));
        if (traces.length === 1) return jsonResponse({}, 503);
      }
      return delegate(input, init);
    }));
    try {
      const traceId = randomUUID();
      const order = await runWithCorrelation({ requestId: randomUUID(), traceId }, () => checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "read-recovery"));
      expect(traces).toEqual([traceId, traceId]);
      expect(await checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "read-recovery")).toEqual(JSON.parse(JSON.stringify(order)));
      expect(await countOrders()).toBe(1);
      expect(reserveCount("product-1")).toBe(1);
    } finally { installFetchDouble(); }
  });
  it("does not retry insufficient stock and retains original business error", async () => {
    failReserveProducts.add("product-1");
    await expect(checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "permanent-reserve")).rejects.toMatchObject({ status: 400, message: "Insufficient stock" });
    const calls = vi.mocked(globalThis.fetch).mock.calls.filter(([input]) => String(input).endsWith("/reserve"));
    expect(calls).toHaveLength(1);
    expect(await countOrders()).toBe(0);
  });
  it("exhausted lost reserve responses preserve uncertain identity for safe same-key compensation", async () => {
    const delegate = globalThis.fetch;
    const identities: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const response = await delegate(input, init);
      if (String(input).endsWith("/reserve")) {
        identities.push(JSON.parse(String(init?.body)).operationId);
        throw Object.assign(new Error("reserve response lost"), { code: "ECONNRESET" });
      }
      return response;
    }));
    try {
      await expect(checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "uncertain-reserve")).rejects.toMatchObject({ status: 503 });
      expect(identities).toHaveLength(3);
      expect(new Set(identities).size).toBe(1);
      expect(reserveCount("product-1")).toBe(1);
      expect(await prisma.checkoutIdempotency.findFirstOrThrow()).toMatchObject({ status: "COMPENSATION_FAILED", reservedItems: [{ productId: "product-1", quantity: 2, reservationUnknown: true }] });
      installFetchDouble();
      await expect(checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "uncertain-reserve")).rejects.toMatchObject({ status: 409, message: "Checkout failed and was compensated" });
      expect(reserveCount("product-1")).toBe(1);
      expect(releaseCalls).toHaveLength(1);
      expect(inventory.get("product-1")?.reservedStock).toBe(0);
      expect(await countOrders()).toBe(0);
      expect(await prisma.checkoutIdempotency.count()).toBe(1);
    } finally { installFetchDouble(); }
  });
});

describe("durable checkout Saga", () => {
  it("guarded cleanup removes independent receipts, budgets and pending intents as well as domain rows", async () => {
    const f = await fixture();
    await f.handleOrderCheckout(f.reserved);
    await prisma.consumerDelivery.create({ data: { consumer: "order.payment-events", messageKey: "cleanup-test", replayCount: 0, attempts: 1 } });
    await truncateOrderDb();
    for (const table of getCleanupTables("order_test_db")) {
      // Table names come only from guarded helper's fixed schema allowlist.
      const rows = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(`SELECT COUNT(*) AS total FROM "${table}"`);
      expect(Number(rows[0].total), table).toBe(0);
    }
  });
  it("scrapes committed Outbox state, excludes rollback and preserves tracing across dispatch", async () => {
    registerCheckoutMetrics(prisma, "order-service");
    const input = createIntegrationEvent({ eventType: "order.confirmed", correlationId: randomUUID(), causationId: null, data: { orderId: randomUUID(), userId: "private-user" } });
    let origin: ReturnType<typeof activeTraceFields> = {};
    await traced("persistent request", SpanKind.INTERNAL, {}, async () => {
      origin = activeTraceFields();
      await prisma.$transaction((tx) => enqueueOutboxEvent(tx, input));
    });
    await prisma.$transaction((tx) => enqueueOutboxEvent(tx, input));
    await expect(prisma.$transaction(async (tx) => { await enqueueOutboxEvent(tx, { ...input, eventId: randomUUID() }); throw new Error("rollback"); })).rejects.toThrow("rollback");
    const stored = await prisma.outboxEvent.findUniqueOrThrow({ where: { eventId: input.eventId } });
    expect(stored.traceparent).toContain(origin.otelTraceId);
    await prisma.outboxEvent.update({ where: { id: stored.id }, data: { createdAt: new Date(Date.now() - 120000), nextAttemptAt: new Date(Date.now() + 60000) } });
    const metrics = await telemetryMetrics();
    expect(metrics).toMatch(/outbox_pending_total\{[^}]*\} 1/);
    const age = Number(metrics.match(/outbox_oldest_pending_age_seconds\{[^}]*\} ([\d.]+)/)?.[1]);
    expect(age).toBeGreaterThanOrEqual(119);
    expect(metrics).toMatch(/business_events_committed_total\{event_type="order.confirmed",[^}]*\} 1/);
    expect(metrics).not.toContain("private-user");
    await prisma.outboxEvent.update({ where: { id: stored.id }, data: { nextAttemptAt: new Date(0) } });
    await dispatchOutboxOnce(prisma, async () => { expect(activeTraceFields().otelTraceId).toBeTruthy(); }, createLogger({ service: "order-service", environment: "test", level: "silent" }));
    expect(await telemetryMetrics()).toMatch(/outbox_pending_total\{[^}]*\} 0/);
  });
  async function fixture() {
    const productId = randomUUID();
    const correlationId = randomUUID();
    const order = await prisma.order.create({ data: { userId: "user-1", eventDriven: true, totalAmount: "10.00", items: {
      create: { productId, productName: "Protein", productSlug: "protein", quantity: 2, unitPrice: "5.00", subtotal: "10.00" },
    }, checkoutSaga: { create: { correlationId } } } });
    const { handleOrderCheckout, recordSagaFailure } = await import("./services/checkout.service.js");
    const reserved = createIntegrationEvent({ eventType: "inventory.reserved", correlationId, causationId: randomUUID(),
      data: { orderId: order.id, reservations: [{ productId, quantity: 2 }] } });
    const succeeded = createIntegrationEvent({ eventType: "payment.succeeded", correlationId, causationId: randomUUID(),
      data: { orderId: order.id, paymentId: randomUUID(), amount: "10.00", currency: "USD" } });
    const progress = () => prisma.checkoutSaga.findUniqueOrThrow({ where: { orderId: order.id } });
    return { order, reserved, succeeded, progress, handleOrderCheckout, recordSagaFailure, productId, correlationId };
  }
  it("separates receipts, business state and Saga progress; duplicate reservation cannot request a second payment", async () => {
    const f = await fixture();
    const { getCheckoutSaga } = await import("./services/checkout.service.js");
    const request = await f.handleOrderCheckout(f.reserved);
    expect(request?.eventType).toBe("checkout.payment_requested");
    expect(await prisma.outboxEvent.findUniqueOrThrow({ where: { eventId: request!.eventId } })).toMatchObject({ publishedAt: null, attempts: 0 });
    expect(await f.handleOrderCheckout(f.reserved)).toEqual(request);
    expect(await f.progress()).toMatchObject({ state: "PAYING", inventoryReserved: true, paymentOutcome: null });
    expect(await getCheckoutSaga(f.order.id)).toMatchObject({ terminal: false, requiresAttention: false });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: f.order.id } })).status).toBe("PENDING");
    await f.handleOrderCheckout(f.succeeded);
    expect(await f.progress()).toMatchObject({ state: "COMPLETED", paymentOutcome: "SUCCEEDED" });
    expect(await getCheckoutSaga(f.order.id)).toMatchObject({ terminal: true, requiresAttention: false });
    const before = await f.progress();
    await f.handleOrderCheckout({ ...f.reserved, eventId: randomUUID() });
    expect(await f.progress()).toEqual(before);
  });
  it("rolls back Saga transition and receipt when atomic Outbox insertion fails", async () => {
    const f = await fixture();
    await prisma.$executeRawUnsafe(`CREATE FUNCTION outbox_test_reject_insert() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'outbox insertion failed'; END; $$`);
    await prisma.$executeRawUnsafe('CREATE TRIGGER outbox_test_reject_insert BEFORE INSERT ON "OutboxEvent" FOR EACH ROW EXECUTE FUNCTION outbox_test_reject_insert()');
    try {
      await expect(f.handleOrderCheckout(f.reserved)).rejects.toThrow("outbox insertion failed");
      expect(await f.progress()).toMatchObject({ state: "RESERVING", inventoryReserved: false });
      expect(await prisma.checkoutEvent.findUnique({ where: { eventId: f.reserved.eventId } })).toBeNull();
      expect(await prisma.outboxEvent.count()).toBe(0);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER outbox_test_reject_insert ON "OutboxEvent"');
      await prisma.$executeRawUnsafe('DROP FUNCTION outbox_test_reject_insert()');
    }
    const next = await f.handleOrderCheckout(f.reserved);
    expect(await f.progress()).toMatchObject({ state: "PAYING" });
    expect(await prisma.outboxEvent.findUnique({ where: { eventId: next!.eventId } })).not.toBeNull();
  });
  it("concurrent Saga deliveries preserve refund and release compensation with one intent per event", async () => {
    const f = await fixture();
    const deliver = async (event: Parameters<typeof processCheckoutEvent>[1]) => {
      const before = await prisma.outboxEvent.count();
      const results = await Promise.all([f.handleOrderCheckout(event), f.handleOrderCheckout(event)]);
      expect(results[1]).toEqual(results[0]);
      expect(await prisma.checkoutEvent.count({ where: { eventId: event.eventId } })).toBe(1);
      expect(await prisma.outboxEvent.count()).toBe(before + (results[0] ? 1 : 0));
      const progress = await f.progress();
      expect(await f.handleOrderCheckout(event)).toEqual(results[0]);
      expect(await f.progress()).toEqual(progress);
      expect(await prisma.outboxEvent.count()).toBe(before + (results[0] ? 1 : 0));
    };
    await deliver(f.reserved);
    await prisma.order.update({ where: { id: f.order.id }, data: { status: "CANCELLED" } });
    await deliver(f.succeeded);
    expect(await f.progress()).toMatchObject({ state: "REFUNDING", paymentOutcome: "SUCCEEDED" });
    await deliver(createIntegrationEvent({ eventType: "payment.refund_failed", correlationId: f.correlationId,
      causationId: f.succeeded.eventId, data: { orderId: f.order.id, paymentId: f.succeeded.data.paymentId, failureCode: "REFUND_FAILED", retryable: true } }));
    await deliver(createIntegrationEvent({ eventType: "payment.refunded", correlationId: f.correlationId,
      causationId: f.succeeded.eventId, data: f.succeeded.data }));
    await deliver(createIntegrationEvent({ eventType: "inventory.release_failed", correlationId: f.correlationId,
      causationId: f.succeeded.eventId, data: { orderId: f.order.id, failureCode: "RELEASE_FAILED", retryable: true } }));
    await deliver(createIntegrationEvent({ eventType: "inventory.released", correlationId: f.correlationId,
      causationId: f.succeeded.eventId, data: f.reserved.data }));
    expect(await f.progress()).toMatchObject({ state: "COMPENSATED", paymentOutcome: "REFUNDED", inventoryReleased: true });
    expect(await prisma.order.findUniqueOrThrow({ where: { id: f.order.id } })).toMatchObject({ status: "CANCELLED" });
  });
  it("retains committed Saga intent during broker failure and recreated publisher drains it", async () => {
    const f = await fixture();
    const event = await f.handleOrderCheckout(f.reserved);
    const logger = createLogger({ service: "outbox-test", environment: "test", level: "silent" });
    await dispatchOutboxOnce(prisma, async () => { throw new Error("broker offline"); }, logger);
    expect(await f.progress()).toMatchObject({ state: "PAYING" });
    expect(await prisma.outboxEvent.findUnique({ where: { eventId: event!.eventId } })).toMatchObject({ attempts: 1, publishedAt: null, lastError: expect.any(String) });
    await prisma.outboxEvent.updateMany({ data: { nextAttemptAt: new Date(0) } });
    const delivered: string[] = [];
    const worker = startOutboxPublisher(prisma, async (next) => { delivered.push(next.eventId); }, logger);
    try { await vi.waitFor(async () => expect(await prisma.outboxEvent.count({ where: { publishedAt: { not: null } } })).toBe(1)); }
    finally { await worker.close(); }
    expect(delivered).toEqual([event!.eventId]);
    expect(await prisma.outboxEvent.findUnique({ where: { eventId: event!.eventId } })).toMatchObject({ attempts: 2, lastError: null });
  });
  it("republishes same confirmed envelope after marker failure; downstream receipt prevents second effect", async () => {
    const f = await fixture();
    const event = await f.handleOrderCheckout(f.reserved);
    const logger = createLogger({ service: "outbox-test", environment: "test", level: "silent" });
    const deliveries: string[] = [];
    let effects = 0;
    const { completeOrderTransition } = await import("./services/order.service.js");
    const publish = async (next: Parameters<typeof processCheckoutEvent>[1]) => {
      deliveries.push(next.eventId);
      await prisma.$transaction((tx) => processCheckoutEvent(tx, next, async () => {
        effects++;
        const order = await tx.order.findUniqueOrThrow({ where: { id: f.order.id } });
        await completeOrderTransition(order, "CONFIRMED", tx);
        return null;
      }));
    };
    await prisma.$executeRawUnsafe(`CREATE FUNCTION outbox_test_reject_marker() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."publishedAt" IS NOT NULL THEN RAISE EXCEPTION 'published marker failed'; END IF; RETURN NEW; END; $$`);
    await prisma.$executeRawUnsafe('CREATE TRIGGER outbox_test_reject_marker BEFORE UPDATE ON "OutboxEvent" FOR EACH ROW EXECUTE FUNCTION outbox_test_reject_marker()');
    try {
      await expect(dispatchOutboxOnce(prisma, publish, logger)).rejects.toThrow("published marker failed");
      expect(await prisma.outboxEvent.findUnique({ where: { eventId: event!.eventId } })).toMatchObject({ publishedAt: null });
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER outbox_test_reject_marker ON "OutboxEvent"');
      await prisma.$executeRawUnsafe('DROP FUNCTION outbox_test_reject_marker()');
    }
    await dispatchOutboxOnce(prisma, publish, logger);
    expect(deliveries).toEqual([event!.eventId, event!.eventId]);
    expect(effects).toBe(1);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: f.order.id } })).status).toBe("CONFIRMED");
  });
  it("separate publisher connections claim different rows until confirmations settle", async () => {
    const a = await fixture();
    const b = await fixture();
    const first = await a.handleOrderCheckout(a.reserved);
    const second = await b.handleOrderCheckout(b.reserved);
    const { PrismaClient } = await import("./generated/prisma/index.js");
    const otherPool = new pg.Pool({ connectionString: databaseUrl });
    const other = new PrismaClient({ adapter: new PrismaPg(otherPool) });
    const logger = createLogger({ service: "outbox-test", environment: "test", level: "silent" });
    let confirm!: () => void;
    const confirmation = new Promise<void>((resolve) => { confirm = resolve; });
    const deliveries: string[] = [];
    const publish = async (next: Parameters<typeof processCheckoutEvent>[1]) => { deliveries.push(next.eventId); await confirmation; };
    const work = Promise.all([dispatchOutboxOnce(prisma, publish, logger), dispatchOutboxOnce(other, publish, logger)]);
    try {
      await vi.waitFor(() => expect(deliveries).toHaveLength(2));
      expect(new Set(deliveries)).toEqual(new Set([first!.eventId, second!.eventId]));
      expect(await prisma.outboxEvent.count({ where: { publishedAt: null } })).toBe(2);
    } finally { confirm(); await work; await other.$disconnect(); await otherPool.end(); }
    expect(await prisma.outboxEvent.count({ where: { publishedAt: { not: null } } })).toBe(2);
  });
  it("durably remembers payment success after transient confirmation failure and resumes without refund", async () => {
    const f = await fixture();
    await f.handleOrderCheckout(f.reserved);
    await prisma.$executeRawUnsafe(`CREATE FUNCTION saga_test_block_confirmation() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."status"='CONFIRMED' THEN RAISE EXCEPTION 'confirmation DB unavailable'; END IF; RETURN NEW; END; $$`);
    await prisma.$executeRawUnsafe('CREATE TRIGGER saga_test_block_confirmation BEFORE UPDATE ON "Order" FOR EACH ROW EXECUTE FUNCTION saga_test_block_confirmation()');
    try {
      await expect(f.handleOrderCheckout(f.succeeded)).rejects.toThrow("confirmation DB unavailable");
      await f.recordSagaFailure(f.succeeded, new Error("DB unavailable"), true);
      expect(await f.progress()).toMatchObject({ state: "CONFIRMING", paymentOutcome: "SUCCEEDED", compensationRetryable: true });
      expect(await prisma.checkoutEvent.findUnique({ where: { eventId: f.succeeded.eventId } })).toBeNull();
      await expect(f.handleOrderCheckout({ ...f.succeeded, causationId: randomUUID() })).rejects.toThrow("Event ID reused");
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER saga_test_block_confirmation ON "Order"');
      await prisma.$executeRawUnsafe('DROP FUNCTION saga_test_block_confirmation()');
    }
    expect((await f.handleOrderCheckout(f.succeeded))?.eventType).toBe("order.confirmed");
    expect(await f.progress()).toMatchObject({ state: "COMPLETED", compensationError: null });
  });
  it("refunds business-invalid confirmation, persists incomplete compensation and resumes repaired failures", async () => {
    const f = await fixture();
    await f.handleOrderCheckout(f.reserved);
    // Arrange legitimate cancellation racing with acknowledged settlement.
    await prisma.order.update({ where: { id: f.order.id }, data: { status: "CANCELLED" } });
    const refund = await f.handleOrderCheckout(f.succeeded);
    expect(refund?.eventType).toBe("checkout.refund_requested");
    const failed = createIntegrationEvent({ eventType: "payment.refund_failed", correlationId: f.correlationId, causationId: refund?.eventId ?? randomUUID(),
      data: { orderId: f.order.id, paymentId: f.succeeded.data.paymentId, failureCode: "REFUND_FAILED", retryable: false } });
    await f.handleOrderCheckout(failed);
    expect(await f.progress()).toMatchObject({ state: "FAILED", failedStep: "REFUND", paymentOutcome: "SUCCEEDED" });
    const refunded = createIntegrationEvent({ eventType: "payment.refunded", correlationId: f.correlationId, causationId: refund?.eventId ?? randomUUID(), data: f.succeeded.data });
    const cancel = await f.handleOrderCheckout(refunded);
    expect(cancel?.eventType).toBe("order.cancelled");
    expect(await f.progress()).toMatchObject({ state: "RELEASING", paymentOutcome: "REFUNDED", inventoryReleased: false });
    const releaseFailed = createIntegrationEvent({ eventType: "inventory.release_failed", correlationId: f.correlationId, causationId: cancel?.eventId ?? randomUUID(),
      data: { orderId: f.order.id, failureCode: "RELEASE_FAILED", retryable: true } });
    await f.handleOrderCheckout(releaseFailed);
    expect(await f.progress()).toMatchObject({ state: "RELEASING", compensationRetryable: true });
    await f.handleOrderCheckout({ ...releaseFailed, eventId: randomUUID(), data: { ...releaseFailed.data, retryable: false } });
    expect(await f.progress()).toMatchObject({ state: "FAILED", failedStep: "RELEASE", inventoryReleased: false });
    const released = createIntegrationEvent({ eventType: "inventory.released", correlationId: f.correlationId, causationId: cancel?.eventId ?? randomUUID(), data: f.reserved.data });
    await f.handleOrderCheckout(released);
    expect(await f.progress()).toMatchObject({ state: "COMPENSATED", inventoryReleased: true, compensationError: null });
    expect(await f.handleOrderCheckout(f.succeeded)).toEqual(refund);
    expect((await f.progress()).state).toBe("COMPENSATED");
  });
  it("release may arrive before refund, but cannot mark compensation finished early", async () => {
    const f = await fixture();
    await f.handleOrderCheckout(f.reserved);
    await prisma.order.update({ where: { id: f.order.id }, data: { status: "CANCELLED" } });
    await f.handleOrderCheckout(f.succeeded);
    await f.handleOrderCheckout(createIntegrationEvent({ eventType: "inventory.released", correlationId: f.correlationId, causationId: randomUUID(), data: f.reserved.data }));
    expect(await f.progress()).toMatchObject({ state: "REFUNDING", inventoryReleased: true, paymentOutcome: "SUCCEEDED" });
    await f.handleOrderCheckout(createIntegrationEvent({ eventType: "payment.refunded", correlationId: f.correlationId, causationId: randomUUID(), data: f.succeeded.data }));
    expect((await f.progress()).state).toBe("COMPENSATED");
  });
  it("unreconcilable financial/fulfilment conflicts remain observable without destructive compensation", async () => {
    const f = await fixture();
    await f.handleOrderCheckout(f.reserved);
    await expect(f.handleOrderCheckout({ ...f.succeeded, data: { ...f.succeeded.data, amount: "11.00" } })).rejects.toThrow("Order cannot safely complete checkout");
    expect(await f.progress()).toMatchObject({ state: "FAILED", paymentOutcome: "SUCCEEDED", failureCode: "PAYMENT_DATA_CONFLICT" });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: f.order.id } })).status).toBe("PENDING");
  });
  it("concurrent success/failure permits one legal path, and duplicate successes converge", async () => {
    const f = await fixture();
    await f.handleOrderCheckout(f.reserved);
    const failure = createIntegrationEvent({ eventType: "payment.failed", correlationId: f.correlationId, causationId: randomUUID(), data: { ...f.succeeded.data, failureCode: "DECLINED" } });
    const { PrismaClient } = await import("./generated/prisma/index.js");
    const otherPool = new pg.Pool({ connectionString: databaseUrl });
    const other = new PrismaClient({ adapter: new PrismaPg(otherPool) });
    let results;
    try { results = await Promise.allSettled([f.handleOrderCheckout(f.succeeded), f.handleOrderCheckout(failure, other)]); }
    finally { await other.$disconnect(); await otherPool.end(); }
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const saga = await f.progress();
    expect(["COMPLETED", "RELEASING"]).toContain(saga.state);
    if (saga.state === "COMPLETED") {
      const duplicates = await Promise.all([f.handleOrderCheckout(f.succeeded), f.handleOrderCheckout(f.succeeded)]);
      expect(duplicates[0]).toEqual(duplicates[1]);
    }
  });
  it("serializes cancellation racing with payment acknowledgement before requesting refund", async () => {
    const f = await fixture();
    await f.handleOrderCheckout(f.reserved);
    const { completeOrderTransition } = await import("./services/order.service.js");
    let paid: ReturnType<typeof f.handleOrderCheckout> | undefined;
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${f.order.id} FOR UPDATE`;
      const order = await tx.order.findUniqueOrThrow({ where: { id: f.order.id } });
      paid = f.handleOrderCheckout(f.succeeded);
      await completeOrderTransition(order, "CANCELLED", tx);
    });
    expect((await paid)?.eventType).toBe("checkout.refund_requested");
    expect(await f.progress()).toMatchObject({ state: "REFUNDING", paymentOutcome: "SUCCEEDED" });
  });
});

describe("async Order checkout", () => {
  it("accepts pending creation without Inventory HTTP or broker, preserves durable root intent through HTTP replay", async () => {
    const { config } = await import("./config/index.js");
    const { createEventDrivenOrderService } = await import("./services/order.service.js");
    const productId = randomUUID();
    setProduct({ id: productId, name: "Protein", slug: "protein", price: "10.00", isPublished: true });
    const body = { items: [{ productId, quantity: 2 }], delivery: defaultDelivery() };
    const correlationId = randomUUID();
    config.checkout.enabled = true;
    try {
      await runWithCorrelation({ requestId: randomUUID(), traceId: correlationId }, async () => {
        const accepted = await createEventDrivenOrderService("user-1", body, "async-create");
        expect(await prisma.order.count()).toBe(1);
        expect(reserveCalls).toHaveLength(0);
        const pending = await createEventDrivenOrderService("user-1", body, "async-create");
        expect(pending.status).toBe("PENDING");
        expect(await createEventDrivenOrderService("user-1", body, "async-create")).toEqual(pending);
        expect(pending).toEqual(JSON.parse(JSON.stringify(accepted)));
        const order = await prisma.order.findUniqueOrThrow({ where: { id: pending.id } });
        expect(JSON.parse(order.creationEvent ?? "{}")).toMatchObject({ correlationId, causationId: null });
        const root = JSON.parse(order.creationEvent ?? "{}");
        expect(await prisma.outboxEvent.findUniqueOrThrow({ where: { eventId: root.eventId } })).toMatchObject({ payload: order.creationEvent, publishedAt: null, attempts: 0 });
        await expect(cancelOrderService(pending.id, "user-1")).rejects.toThrow("still pending");
      });
    } finally { config.checkout.enabled = false; }
  });
  it.each(["payment.succeeded", "payment.failed", "inventory.reservation_failed"] as const)("applies %s once, replays outcome and rejects conflicting late events", async (type) => {
    const { handleOrderCheckout } = await import("./services/checkout.service.js");
    const productId = randomUUID();
    const order = await prisma.order.create({ data: { userId: "user-1", eventDriven: true, totalAmount: "10.00", items: {
      create: { productId, productName: "Protein", productSlug: "protein", quantity: 2, unitPrice: "5.00", subtotal: "10.00" },
    } } });
    const metadata = { correlationId: randomUUID(), causationId: randomUUID() };
    const payment = { orderId: order.id, paymentId: randomUUID(), amount: "10.00", currency: "USD" as const };
    const input = type === "payment.succeeded" ? createIntegrationEvent({ eventType: type, ...metadata, data: payment }) :
      type === "payment.failed" ? createIntegrationEvent({ eventType: type, ...metadata, data: { ...payment, failureCode: "FAKE_DECLINED" } }) :
        createIntegrationEvent({ eventType: type, ...metadata, data: { orderId: order.id, productId, quantity: 2, reason: "INSUFFICIENT_STOCK" } });
    const first = await handleOrderCheckout(input);
    expect(await handleOrderCheckout(input)).toEqual(first);
    expect(first).toMatchObject({ correlationId: input.correlationId, causationId: input.eventId });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe(type === "payment.succeeded" ? "CONFIRMED" : "CANCELLED");
    expect(releaseCalls).toHaveLength(0);
    const opposite = type === "payment.succeeded" ? createIntegrationEvent({ eventType: "payment.failed", ...metadata, data: { ...payment, failureCode: null } }) :
      createIntegrationEvent({ eventType: "payment.succeeded", ...metadata, data: payment });
    await expect(handleOrderCheckout(opposite)).rejects.toThrow("Obsolete checkout outcome");
  });
});

describe("checkout idempotency", () => {
  it("creates an order on first successful checkout", async () => {
    const order = await checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "checkout-key-1");

    expect(order.items).toHaveLength(1);
    expect(order.totalAmount).toBe(20);
    expect(await countOrders()).toBe(1);
    expect(reserveCount("product-1")).toBe(1);
  });

  it("replays the same completed checkout without another order or reservation", async () => {
    const first = await checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "checkout-key-2");
    cartVersion = 1;
  setCart([{ id: "cart-item-1", productId: "product-1", quantity: 2 }]);

    const second = await checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "checkout-key-2");

    expect(second).toMatchObject({ id: first.id, totalAmount: first.totalAmount });
    expect(await countOrders()).toBe(1);
    expect(reserveCount("product-1")).toBe(1);
  });

  it("does not depend on process memory for replay", async () => {
    const first = await checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "checkout-key-db");
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: { code: "INTERNAL_ERROR", message: "should not call downstream" } }, 500)));

    const second = await checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "checkout-key-db");

    expect(second).toMatchObject({ id: first.id });
    expect(globalThis.fetch).not.toHaveBeenCalled();
    installFetchDouble();
  });

  it("executes concurrent duplicate checkout only once", async () => {
    reserveDelayMs = 50;

    const results = await Promise.allSettled([
      checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "checkout-key-race"),
      checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "checkout-key-race"),
    ]);

    expect(await countOrders()).toBe(1);
    expect(reserveCount("product-1")).toBe(1);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("rejects same key with different logical input", async () => {
    await checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "checkout-key-conflict");

    await expect(
      checkoutOrderService("user-1", checkoutBody(["cart-item-1", "cart-item-2"]), "checkout-key-conflict"),
    ).rejects.toMatchObject({ status: 409, message: "Idempotency key was reused with a different request" });
  });

  it("scopes the same idempotency key independently per user", async () => {
    await checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "shared-key");
    cartVersion = 1;
  setCart([{ id: "cart-item-1", productId: "product-1", quantity: 2 }]);

    await checkoutOrderService("user-2", checkoutBody(["cart-item-1"]), "shared-key");

    expect(await countOrders()).toBe(2);
    expect(reserveCount("product-1")).toBe(2);
  });

  it("validates missing and invalid idempotency keys", async () => {
    await request(app)
      .post("/orders/checkout")
      .send(checkoutBody(["cart-item-1"]))
      .expect(400);

    await request(app)
      .post("/orders/checkout")
      .set("Idempotency-Key", "bad key")
      .send(checkoutBody(["cart-item-1"]))
      .expect(400);
  });

  it("keeps existing business errors mapped", async () => {
    await expect(
      checkoutOrderService("user-1", checkoutBody(["missing-cart-item"]), "checkout-key-business-error"),
    ).rejects.toMatchObject({ status: 404, message: "Cart item not found" });

    expect(await countOrders()).toBe(0);
    expect(reserveCalls).toHaveLength(0);
  });
  it("rolls back earlier reservations when a later reservation fails", async () => {
    setCart([
      { id: "cart-item-1", productId: "product-1", quantity: 2 },
      { id: "cart-item-2", productId: "product-2", quantity: 3 },
    ]);
    failReserveProducts.add("product-2");

    await expect(
      checkoutOrderService("user-1", checkoutBody(["cart-item-1", "cart-item-2"]), "checkout-key-rollback"),
    ).rejects.toMatchObject({ status: 400, message: "Insufficient stock" });

    expect(await countOrders()).toBe(0);
    expect(inventory.get("product-1")).toMatchObject({ stock: 10, reservedStock: 0 });
    expect(releaseCalls).toEqual([{ productId: "product-1", quantity: 2 }]);
  });

  it("records compensation failure durably and retries without double release", async () => {
    setCart([
      { id: "cart-item-1", productId: "product-1", quantity: 2 },
      { id: "cart-item-2", productId: "product-2", quantity: 3 },
    ]);
    failReserveProducts.add("product-2");
    failReleaseProducts.add("product-1");

    const failure = await checkoutOrderService("user-1", checkoutBody(["cart-item-1", "cart-item-2"]), "checkout-key-compensation").catch((error: unknown) => error);
    expect(failure).toMatchObject({ status: 400, message: "Insufficient stock" });

    const [failedAttempt] = await prisma.$queryRaw<Array<{ status: string }>>`SELECT "status" FROM "CheckoutIdempotency" WHERE "userId" = ${"user-1"} AND "idempotencyKey" = ${"checkout-key-compensation"}`;
    expect(failedAttempt.status).toBe("COMPENSATION_FAILED");
    expect(inventory.get("product-1")).toMatchObject({ stock: 10, reservedStock: 2 });

    failReleaseProducts.clear();
  failConsumeProducts.clear();
  inventoryOperations.clear();
    await expect(
      checkoutOrderService("user-1", checkoutBody(["cart-item-1", "cart-item-2"]), "checkout-key-compensation"),
    ).rejects.toMatchObject({ status: 409, message: "Checkout failed and was compensated" });

    const [retriedAttempt] = await prisma.$queryRaw<Array<{ status: string }>>`SELECT "status" FROM "CheckoutIdempotency" WHERE "userId" = ${"user-1"} AND "idempotencyKey" = ${"checkout-key-compensation"}`;
    expect(retriedAttempt.status).toBe("FAILED");
    expect(inventory.get("product-1")).toMatchObject({ stock: 10, reservedStock: 0 });
    expect(releaseCalls).toEqual([{ productId: "product-1", quantity: 2 }]);
  });

  it("persists normalized delivery snapshot and returns it on retrieval", async () => {
    const delivery = {
      ...defaultDelivery(),
      recipientName: "  Lukasz Kowalski  ",
      addressLine1: "  Ulica Testowa 5  ",
      addressLine2: "  ",
      region: "  ",
      countryCode: "fi",
    };

    const response = await request(app)
      .post("/orders/checkout")
      .set("Idempotency-Key", "checkout-key-delivery")
      .send(checkoutBody(["cart-item-1"], delivery))
      .expect(201);

    expect(response.body.delivery).toEqual({
      recipientName: "Lukasz Kowalski",
      contactPhone: "+358 40 123 4567",
      addressLine1: "Ulica Testowa 5",
      addressLine2: null,
      city: "Helsinki",
      region: null,
      postalCode: "00100",
      countryCode: "FI",
    });

    const stored = await request(app).get(`/orders/${response.body.id}`).expect(200);
    expect(stored.body.delivery).toEqual(response.body.delivery);
  });

  it("rejects invalid delivery data before checkout side effects", async () => {
    await request(app)
      .post("/orders/checkout")
      .set("Idempotency-Key", "checkout-key-invalid-delivery")
      .send(checkoutBody(["cart-item-1"], { ...defaultDelivery(), addressLine1: "   " }))
      .expect(400);

    expect(await countOrders()).toBe(0);
    expect(reserveCalls).toHaveLength(0);
    expect(removeCalls).toHaveLength(0);
  });

  it("includes delivery details in idempotency conflict detection", async () => {
    await checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "checkout-key-delivery-conflict");

    await expect(
      checkoutOrderService(
        "user-1",
        checkoutBody(["cart-item-1"], { ...defaultDelivery(), city: "Espoo" }),
        "checkout-key-delivery-conflict",
      ),
    ).rejects.toMatchObject({ status: 409, message: "Idempotency key was reused with a different request" });
  });

  it("allows different idempotency keys to use different delivery snapshots", async () => {
    const first = await checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "checkout-key-delivery-a");
    cartVersion = 1;
    setCart([{ id: "cart-item-1", productId: "product-1", quantity: 2 }]);

    const second = await checkoutOrderService(
      "user-1",
      checkoutBody(["cart-item-1"], { ...defaultDelivery(), city: "Tampere" }),
      "checkout-key-delivery-b",
    );

    expect(first.delivery?.city).toBe("Helsinki");
    expect(second.delivery?.city).toBe("Tampere");
    expect(await countOrders()).toBe(2);
  });

  it("calculates decimal totals exactly from authoritative catalog prices", async () => {
    setProduct({ id: "product-1", name: "Protein", slug: "protein", price: "12.33", isPublished: true });
    setProduct({ id: "product-2", name: "Creatine", slug: "creatine", price: "0.34", isPublished: true });
    setCart([
      { id: "cart-item-1", productId: "product-1", quantity: 3 },
      { id: "cart-item-2", productId: "product-2", quantity: 1 },
    ]);

    const order = await checkoutOrderService("user-1", checkoutBody(["cart-item-1", "cart-item-2"]), "checkout-key-decimal");

    expect(order.totalAmount).toBe(37.33);
    expect(order.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ productId: "product-1", unitPrice: 12.33, subtotal: 36.99 }),
        expect.objectContaining({ productId: "product-2", unitPrice: 0.34, subtotal: 0.34 }),
      ]),
    );
  });

  it("aggregates duplicate product inputs into one order line", async () => {
    const order = await createOrderService(
      "user-1",
      {
        items: [
          { productId: "product-1", quantity: 1 },
          { productId: "product-1", quantity: 2 },
        ],
        delivery: defaultDelivery(),
      },
    );

    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({ productId: "product-1", quantity: 3, subtotal: 30 });
    expect(reserveCalls).toEqual([{ productId: "product-1", quantity: 3 }]);
  });

  it("rejects invalid authoritative catalog price before reservation", async () => {
    setProduct({ id: "product-1", name: "Protein", slug: "protein", price: "10.001", isPublished: true });

    await expect(
      checkoutOrderService("user-1", checkoutBody(["cart-item-1"]), "checkout-key-bad-price"),
    ).rejects.toMatchObject({ status: 400, message: "Product price is invalid" });

    expect(await countOrders()).toBe(0);
    expect(releaseCalls).toEqual([]);
    expect(reserveCalls).toEqual([]);
    expect(removeCalls).toHaveLength(0);
  });

  it("rejects invalid direct order quantities before side effects", async () => {
    await request(app)
      .post("/orders")
      .send({ items: [{ productId: "product-1", quantity: 0 }], delivery: defaultDelivery() })
      .expect(400);

    expect(await countOrders()).toBe(0);
    expect(reserveCalls).toHaveLength(0);
  });

  it("keeps confirmation reserved and consumes inventory when processing starts", async () => {
    const order = await createOrderService("user-1", {
      items: [{ productId: "product-1", quantity: 3 }],
      delivery: defaultDelivery(),
    });

    const confirmed = await confirmOrderService(order.id, "admin-1", "ADMIN");

    expect(confirmed.status).toBe("CONFIRMED");
    expect(inventory.get("product-1")).toMatchObject({ stock: 10, reservedStock: 3 });
    const processed = await advanceOrderService(order.id, "admin-1", "ADMIN", "PROCESSING");
    expect(processed.status).toBe("PROCESSING");
    expect(inventory.get("product-1")).toMatchObject({ stock: 7, reservedStock: 0 });
    expect(consumeCalls).toEqual([{ productId: "product-1", quantity: 3 }]);
  });

  it("rejects repeat public confirmation without inventory effects", async () => {
    const order = await createOrderService("user-1", {
      items: [{ productId: "product-1", quantity: 2 }],
      delivery: defaultDelivery(),
    });
    await confirmOrderService(order.id, "admin-1", "ADMIN");
    await expect(confirmOrderService(order.id, "admin-1", "ADMIN")).rejects.toMatchObject({ status: 409, code: "INVALID_ORDER_TRANSITION" });
    expect(inventory.get("product-1")).toMatchObject({ stock: 10, reservedStock: 2 });
    expect(consumeCalls).toEqual([]);
  });

  it("pins processing intent for retry if multi-item consume fails midway", async () => {
    setCart([
      { id: "cart-item-1", productId: "product-1", quantity: 2 },
      { id: "cart-item-2", productId: "product-2", quantity: 1 },
    ]);
    const order = await createOrderService("user-1", {
      items: [
        { productId: "product-1", quantity: 2 },
        { productId: "product-2", quantity: 1 },
      ],
      delivery: defaultDelivery(),
    });
    failConsumeProducts.add("product-2");
    await confirmOrderService(order.id, "admin-1", "ADMIN");
    await expect(advanceOrderService(order.id, "admin-1", "ADMIN", "PROCESSING"))
      .rejects.toMatchObject({ status: 503, message: "Inventory service unavailable" });

    const stored = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(stored.status).toBe("CONFIRMED");
    expect(stored.pendingStatus).toBe("PROCESSING");
    await expect(cancelOrderService(order.id, "user-1")).rejects.toMatchObject({ status: 409, code: "ORDER_COMMAND_IN_PROGRESS" });
    expect(inventory.get("product-1")).toMatchObject({ stock: 8, reservedStock: 0 });
    expect(inventory.get("product-2")).toMatchObject({ stock: 10, reservedStock: 1 });

    failConsumeProducts.clear();
    const retried = await advanceOrderService(order.id, "admin-1", "ADMIN", "PROCESSING");

    expect(retried.status).toBe("PROCESSING");
    expect(inventory.get("product-1")).toMatchObject({ stock: 8, reservedStock: 0 });
    expect(inventory.get("product-2")).toMatchObject({ stock: 9, reservedStock: 0 });
    expect(consumeCalls).toEqual([
      { productId: "product-1", quantity: 2 },
      { productId: "product-2", quantity: 1 },
    ]);
  });

  it("releases reserved inventory before cancelling an order", async () => {
    const order = await createOrderService("user-1", {
      items: [{ productId: "product-1", quantity: 3 }],
      delivery: defaultDelivery(),
    });

    const cancelled = await cancelOrderService(order.id, "user-1");

    expect(cancelled.status).toBe("CANCELLED");
    expect(inventory.get("product-1")).toMatchObject({ stock: 10, reservedStock: 0 });
    expect(releaseCalls).toEqual([{ productId: "product-1", quantity: 3 }]);
  });

  it("runs entire lifecycle and rejects skipped, backward and terminal transitions", async () => {
    const order = await createOrderService("user-1", { items: [{ productId: "product-1", quantity: 2 }], delivery: defaultDelivery() });
    for (const command of ["ship", "deliver", "process"]) {
      const response = await request(app).patch(`/orders/${order.id}/${command}`).set("x-test-user-role", "ADMIN").expect(409);
      expect(response.body.error.code).toBe("INVALID_ORDER_TRANSITION");
    }
    for (const [command, status] of [["confirm", "CONFIRMED"], ["process", "PROCESSING"], ["ship", "SHIPPED"], ["deliver", "DELIVERED"]]) {
      const response = await request(app).patch(`/orders/${order.id}/${command}`).set("x-test-user-id", "admin-1").set("x-test-user-role", "ADMIN").expect(200);
      expect(response.body.status).toBe(status);
      expect(response.body).not.toHaveProperty("pendingStatus");
      expect(response.body).not.toHaveProperty("reservationConsumed");
      if (status === "PROCESSING") await request(app).patch(`/orders/${order.id}/cancel`).expect(409);
    }
    await request(app).patch(`/orders/${order.id}/process`).set("x-test-user-role", "ADMIN").expect(409);
    await request(app).patch(`/orders/${order.id}/cancel`).expect(409);
    expect(consumeCalls).toEqual([{ productId: "product-1", quantity: 2 }]);
    expect(releaseCalls).toEqual([]);
  });

  it("cancels confirmed order and rejects terminal confirmation/repeated cancellation", async () => {
    const order = await createOrderService("user-1", { items: [{ productId: "product-1", quantity: 2 }], delivery: defaultDelivery() });
    await confirmOrderService(order.id, "admin-1", "ADMIN");
    expect((await cancelOrderService(order.id, "user-1")).status).toBe("CANCELLED");
    await expect(cancelOrderService(order.id, "user-1")).rejects.toMatchObject({ status: 409 });
    await expect(confirmOrderService(order.id, "admin-1", "ADMIN")).rejects.toMatchObject({ status: 409 });
    expect(releaseCalls).toHaveLength(1);
    expect(inventory.get("product-1")).toMatchObject({ stock: 10, reservedStock: 0 });
  });

  it("isolates customer reads/cancellation and rejects customer fulfilment commands", async () => {
    const order = await createOrderService("user-2", { items: [{ productId: "product-1", quantity: 2 }], delivery: defaultDelivery() });
    const list = await request(app).get("/orders/me").expect(200);
    expect(list.body.items).toEqual([]);
    await request(app).get(`/orders/${order.id}`).expect(403);
    await request(app).patch(`/orders/${order.id}/cancel`).expect(403);
    await expect(cancelOrderService(order.id, "")).rejects.toMatchObject({ status: 403 });
    for (const command of ["confirm", "process", "ship", "deliver"]) {
      await request(app).patch(`/orders/${order.id}/${command}`).set("x-test-user-id", "user-2").expect(403);
    }
    await request(app).get("/orders/missing").expect(404);
    expect(releaseCalls).toEqual([]);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("PENDING");
  });

  it("serializes concurrent cancellations with at most one inventory release", async () => {
    const order = await createOrderService("user-1", { items: [{ productId: "product-1", quantity: 2 }], delivery: defaultDelivery() });
    const results = await Promise.allSettled([cancelOrderService(order.id, "user-1"), cancelOrderService(order.id, "user-1")]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(releaseCalls).toHaveLength(1);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe("CANCELLED");
  });

  it("racing process/cancel cannot both mutate inventory", async () => {
    const order = await createOrderService("user-1", { items: [{ productId: "product-1", quantity: 2 }], delivery: defaultDelivery() });
    await confirmOrderService(order.id, "admin-1", "ADMIN");
    const results = await Promise.allSettled([advanceOrderService(order.id, "admin-1", "ADMIN", "PROCESSING"), cancelOrderService(order.id, "user-1")]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const stored = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(["PROCESSING", "CANCELLED"]).toContain(stored.status);
    expect(releaseCalls.length + consumeCalls.length).toBe(1);
    expect(inventory.get("product-1")?.reservedStock).toBe(0);
  });

  it("retains cancellation intent on partial release failure and safely retries", async () => {
    const order = await createOrderService("user-1", { items: [{ productId: "product-1", quantity: 2 }, { productId: "product-2", quantity: 1 }], delivery: defaultDelivery() });
    failReleaseProducts.add("product-2");
    await expect(cancelOrderService(order.id, "user-1")).rejects.toMatchObject({ status: 503 });
    expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ status: "PENDING", pendingStatus: "CANCELLED" });
    await expect(confirmOrderService(order.id, "admin-1", "ADMIN")).rejects.toMatchObject({ status: 409 });
    failReleaseProducts.clear();
    await cancelOrderService(order.id, "user-1");
    expect(releaseCalls).toEqual([{ productId: "product-1", quantity: 2 }, { productId: "product-2", quantity: 1 }]);
    expect(inventory.get("product-1")?.reservedStock).toBe(0);
    expect(inventory.get("product-2")?.reservedStock).toBe(0);
  });

  it("retries lost Inventory release acknowledgement without double mutation", async () => {
    const order = await createOrderService("user-1", { items: [{ productId: "product-1", quantity: 2 }], delivery: defaultDelivery() });
    const fetchImpl = globalThis.fetch;
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const response = await fetchImpl(input, init);
      if (String(input).endsWith("/release")) throw new Error("Acknowledgement lost after release");
      return response;
    }));
    await expect(cancelOrderService(order.id, "user-1")).rejects.toMatchObject({ status: 503 });
    expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ status: "PENDING", pendingStatus: "CANCELLED" });
    installFetchDouble();
    expect((await cancelOrderService(order.id, "user-1")).status).toBe("CANCELLED");
    expect(releaseCalls).toHaveLength(1);
  });

  it("keeps durable cancellation intent when final Order DB update fails after release", async () => {
    const order = await createOrderService("user-1", { items: [{ productId: "product-1", quantity: 2 }], delivery: defaultDelivery() });
    await prisma.$executeRawUnsafe(`CREATE FUNCTION phase3_fail_status() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'private status failure'; END $$`);
    try {
      await prisma.$executeRawUnsafe(`CREATE TRIGGER phase3_fail_status BEFORE UPDATE OF "status" ON "Order" FOR EACH ROW EXECUTE FUNCTION phase3_fail_status()`);
      await expect(cancelOrderService(order.id, "user-1")).rejects.toThrow();
      expect(await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).toMatchObject({ status: "PENDING", pendingStatus: "CANCELLED" });
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS phase3_fail_status ON "Order"');
      await prisma.$executeRawUnsafe('DROP FUNCTION phase3_fail_status()');
    }
    await cancelOrderService(order.id, "user-1");
    expect(releaseCalls).toHaveLength(1);
    expect(inventory.get("product-1")?.reservedStock).toBe(0);
  });

  it("preserves historical snapshots and computes decimal totals from Catalog", async () => {
    setProduct({ id: "product-1", name: "Original", slug: "original", price: "0.10", isPublished: true });
    setProduct({ id: "product-2", name: "Second", slug: "second", price: "0.20", isPublished: true });
    const response = await request(app).post("/orders").send({ userId: "spoof", status: "DELIVERED", totalAmount: 1,
      items: [{ productId: "product-1", quantity: 3, unitPrice: 100, productName: "spoof" }, { productId: "product-2", quantity: 2 }], delivery: defaultDelivery() }).expect(201);
    expect(response.body).toMatchObject({ userId: "user-1", status: "PENDING", totalAmount: 0.7 });
    setProduct({ id: "product-1", name: "Changed", slug: "changed", price: "99.00", isPublished: true });
    const read = await request(app).get(`/orders/${response.body.id}`).expect(200);
    expect(read.body.items).toContainEqual(expect.objectContaining({ productName: "Original", productSlug: "original", unitPrice: 0.1, subtotal: 0.3 }));
  });

  it.each([[], [{ productId: "product-1", quantity: -1 }], [{ productId: "product-1", quantity: 1.5 }], [{ productId: " ", quantity: 1 }]].map((items) => ({ items })))("rejects malformed contents $items", async ({ items }) => {
    const response = await request(app).post("/orders").send({ items, delivery: defaultDelivery() }).expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(await countOrders()).toBe(0);
    expect(reserveCalls).toEqual([]);
  });

  it("rejects nonexistent/unpublished products and insufficient aggregated stock", async () => {
    await request(app).post("/orders").send({ items: [{ productId: "missing", quantity: 1 }], delivery: defaultDelivery() }).expect(404);
    setProduct({ id: "product-2", name: "Second", slug: "second", price: "1.00", isPublished: false });
    await request(app).post("/orders").send({ items: [{ productId: "product-2", quantity: 1 }], delivery: defaultDelivery() }).expect(400);
    await request(app).post("/orders").send({ items: [{ productId: "product-1", quantity: 6 }, { productId: "product-1", quantity: 5 }], delivery: defaultDelivery() }).expect(400);
    expect(await countOrders()).toBe(0);
    expect(reserveCalls).toEqual([]);
  });

  it("rolls back real local Order/OrderItems transaction and compensates reserve on DB failure", async () => {
    await prisma.$executeRawUnsafe(`CREATE FUNCTION phase3_fail_delivery() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'private DB failure'; END $$`);
    try {
      await prisma.$executeRawUnsafe(`CREATE TRIGGER phase3_fail_delivery BEFORE UPDATE OF "recipientName" ON "Order" FOR EACH ROW EXECUTE FUNCTION phase3_fail_delivery()`);
      const response = await request(app).post("/orders").send({ items: [{ productId: "product-1", quantity: 2 }], delivery: defaultDelivery() }).expect(500);
      expect(response.body).toEqual({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
      expect(await countOrders()).toBe(0);
      expect(await prisma.orderItem.count()).toBe(0);
      expect(releaseCalls).toEqual([{ productId: "product-1", quantity: 2 }]);
      expect(inventory.get("product-1")?.reservedStock).toBe(0);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER IF EXISTS phase3_fail_delivery ON "Order"');
      await prisma.$executeRawUnsafe('DROP FUNCTION phase3_fail_delivery()');
    }
  });

  it("never releases legacy confirmed stock already consumed before migration", async () => {
    const order = await createOrderService("user-1", { items: [{ productId: "product-1", quantity: 2 }], delivery: defaultDelivery() });
    await prisma.order.update({ where: { id: order.id }, data: { status: "CONFIRMED", reservationConsumed: true } });
    await expect(cancelOrderService(order.id, "user-1")).rejects.toMatchObject({ status: 409, code: "ORDER_INVENTORY_CONSUMED" });
    expect(releaseCalls).toEqual([]);
    await advanceOrderService(order.id, "admin-1", "ADMIN", "PROCESSING");
    expect(consumeCalls).toEqual([]);
  });

  it("protects internal confirmation with shared secret and public confirmation with role", async () => {
    const { createGatewaySecretMiddleware } = await import("@shared/utils");
    const { attachOrderUser } = await import("./middleware/user-context.middleware.js");
    const routes = (await import("./routes/order.route.js")).default;
    const protectedApp = express();
    protectedApp.use(createGatewaySecretMiddleware("fitsupply_test_internal_secret"));
    protectedApp.use(attachOrderUser);
    protectedApp.use(routes);
    protectedApp.use(errorHandler);
    const order = await createOrderService("user-1", { items: [{ productId: "product-1", quantity: 2 }], delivery: defaultDelivery() });
    await request(protectedApp).patch(`/internal/orders/${order.id}/confirm`).expect(403);
    await request(protectedApp).patch(`/internal/orders/${order.id}/confirm`).set("x-internal-secret", "wrong").expect(403);
    await request(protectedApp).patch(`/orders/${order.id}/confirm`).set("x-internal-secret", "fitsupply_test_internal_secret").set("x-user-id", "user-1").set("x-user-role", "CUSTOMER").expect(403);
    for (let retry = 0; retry < 2; retry++) {
      const response = await request(protectedApp).patch(`/internal/orders/${order.id}/confirm`).set("x-internal-secret", "fitsupply_test_internal_secret").expect(200);
      expect(response.body.status).toBe("CONFIRMED");
    }
    expect(consumeCalls).toEqual([]);
  });
  it("rejects direct database writes that violate order constraints", async () => {
    await expect(
      prisma.$executeRaw`INSERT INTO "Order" ("id", "userId", "status", "totalAmount", "createdAt", "updatedAt") VALUES (${"bad-order"}, ${"user-1"}, ${"PENDING"}, ${-1}, NOW(), NOW())`,
    ).rejects.toThrow();

    await prisma.$executeRaw`INSERT INTO "Order" ("id", "userId", "status", "totalAmount", "recipientName", "contactPhone", "deliveryAddressLine1", "deliveryCity", "deliveryPostalCode", "deliveryCountryCode", "createdAt", "updatedAt") VALUES (${"constraint-order"}, ${"user-1"}, ${"PENDING"}, ${0}, ${"Ada"}, ${"+358 40 123 4567"}, ${"Street 1"}, ${"Helsinki"}, ${"00100"}, ${"FI"}, NOW(), NOW())`;
    await expect(
      prisma.$executeRaw`INSERT INTO "OrderItem" ("id", "orderId", "productId", "productName", "productSlug", "quantity", "unitPrice", "subtotal", "createdAt", "updatedAt") VALUES (${"bad-item"}, ${"constraint-order"}, ${"product-1"}, ${"Protein"}, ${"protein"}, ${1}, ${2}, ${3}, NOW(), NOW())`,
    ).rejects.toThrow();
  });

});

afterAll(() => {
  vi.stubGlobal("fetch", originalFetch);
});












