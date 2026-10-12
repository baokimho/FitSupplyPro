import { execFileSync } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createLogger, deserializeIntegrationEvent, serializeIntegrationEvent, openRabbitMq, readRabbitMqConfig,
  createIntegrationEvent, DOMAIN_EXCHANGE, DOMAIN_QUEUES, type KnownIntegrationEvent } from "@shared/utils";

const url = process.env.API_GATEWAY_URL ?? "http://localhost:3500";
const decline = process.env.TEST_CHECKOUT_PAYMENT_OUTCOME === "FAILED";
const idSchema = z.object({ data: z.object({ id: z.string().uuid() }) });
const orderSchema = z.object({ id: z.string().uuid(), userId: z.string(), status: z.string() });
let admin: string;
let broker: Awaited<ReturnType<typeof openRabbitMq>>;
let channel: Awaited<ReturnType<typeof broker.createChannel>>;
let publisher: Awaited<ReturnType<typeof broker.createPublisher>>;
let auditQueue: string;
const events: KnownIntegrationEvent[] = [];

async function json(method: string, path: string, token?: string, body?: unknown, key?: string): Promise<unknown> {
  const response = await fetch(`${url}${path}`, { method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...(key ? { "Idempotency-Key": key } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
  if (method === "POST" && path.startsWith("/order/")) expect(response.status).toBe(201);
  return response.json();
}

function sql(database: string, query: string): string {
  const result = execFileSync("docker", ["compose", "-p", "fitsupply-e2e", "-f", "docker-compose.test.yml", "exec", "-T", "postgres-test",
    "psql", "-U", "fitsupply_test", "-d", database, "-At", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8" });
  return result.trim();
}
const scalar = (database: string, query: string) => z.coerce.number().int().parse(sql(database, query));
const saga = (orderId: string) => z.object({ state: z.string(), inventoryReleased: z.boolean(), paymentOutcome: z.string().nullable() })
  .parse(JSON.parse(sql("order_test_db", `SELECT row_to_json(s) FROM "CheckoutSaga" s WHERE "orderId"='${orderId}'`)));

async function audit() {
  for (let i = 0; i < 500; i++) {
    const message = await channel.get(auditQueue, { noAck: true });
    if (!message) break;
    events.push(deserializeIntegrationEvent(message.content));
  }
}

async function catalog(stock: number) {
  const suffix = randomUUID();
  const customer = z.object({ accessToken: z.string(), user: z.object({ id: z.string() }) }).parse(await json("POST", "/auth/register", undefined,
    { email: `${suffix}@fitsupply.test`, password: "CustomerE2E!12345", name: "Async customer" }));
  const category = idSchema.parse(await json("POST", "/catalog/categories", admin, { name: suffix, slug: suffix }));
  const brand = idSchema.parse(await json("POST", "/catalog/brands", admin, { name: suffix, slug: suffix }));
  const product = idSchema.parse(await json("POST", "/catalog/products", admin, {
    name: "Protein", slug: `protein-${suffix}`, sku: suffix, price: 10, images: [], description: "Async checkout", isPublished: false,
    categoryId: category.data.id, brandId: brand.data.id,
  }));
  const productId = product.data.id;
  await json("PATCH", `/catalog/products/${productId}/publish`, admin);
  await json("POST", "/inventory", admin, { productId, stock, lowStockThreshold: 0 });
  return { customer, productId, suffix };
}
async function setup(stock: number) {
  const { customer, productId, suffix } = await catalog(stock);
  const cart = z.object({ items: z.array(z.object({ id: z.string() })) }).parse(await json("POST", "/cart/items", customer.accessToken, { productId, quantity: 3 }));
  const body = { cartItemIds: cart.items.map((item) => item.id), delivery: {
    recipientName: "Async Customer", contactPhone: "+358401234567", addressLine1: "Testikatu 1", city: "Helsinki", postalCode: "00100", countryCode: "FI",
  } };
  const key = `async:${suffix}`;
  const order = orderSchema.parse(await json("POST", "/order/orders/checkout", customer.accessToken, body, key));
  expect(order.status).toBe("PENDING");
  expect(await json("POST", "/order/orders/checkout", customer.accessToken, body, key)).toMatchObject({ id: order.id, status: "PENDING" });
  return { customer, productId, body, key, order };
}

beforeAll(async () => {
  if (process.env.EVENT_DRIVEN_CHECKOUT !== "true") throw new Error("Async E2E requires event-driven test stack");
  const config = readRabbitMqConfig();
  const endpoint = new URL(config.url);
  if (endpoint.hostname !== "localhost" || endpoint.port !== "5674" || endpoint.username !== "fitsupply_test") throw new Error("Async E2E requires isolated broker localhost:5674");
  admin = z.object({ accessToken: z.string() }).parse(await json("POST", "/auth/login", undefined,
    { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD })).accessToken;
  broker = await openRabbitMq(config, createLogger({ service: "async-e2e", environment: "test", level: "silent" }));
  channel = await broker.createChannel();
  auditQueue = (await channel.assertQueue("", { exclusive: true, autoDelete: true })).queue;
  for (const binding of ["order.*", "inventory.*", "payment.*", "checkout.*"]) await channel.bindQueue(auditQueue, DOMAIN_EXCHANGE, binding);
  publisher = await broker.createPublisher();
}, 20000);
afterAll(async () => { if (broker) await broker.close(); });

describe("event-driven HTTP checkout", () => {
  it(decline ? "provider decline cancels Order and releases stock once under duplicate delivery" : "confirms Order and charges/reserves once under duplicate delivery", async () => {
    const { customer, productId, order } = await setup(10);
    const terminal = decline ? "CANCELLED" : "CONFIRMED";
    await vi.waitFor(async () => {
      expect(orderSchema.parse(await json("GET", `/order/orders/${order.id}`, customer.accessToken)).status).toBe(terminal);
      expect(await json("GET", `/inventory/products/${productId}`, admin)).toMatchObject({ stock: 10, reservedStock: decline ? 0 : 3 });
      await audit();
      expect(events.some((event) => event.data.orderId === order.id && event.eventType === (decline ? "inventory.released" : "order.confirmed"))).toBe(true);
    }, { timeout: 20000, interval: 100 });
    const flow = [...new Map(events.filter((event) => event.data.orderId === order.id).map((event) => [event.eventType, event])).values()];
    const root = flow.find((event) => event.eventType === "order.created");
    if (!root) throw new Error("Root event missing");
    const names = decline ? ["order.created", "inventory.reserved", "checkout.payment_requested", "payment.failed", "order.cancelled", "inventory.released"] :
      ["order.created", "inventory.reserved", "checkout.payment_requested", "payment.succeeded", "order.confirmed"];
    expect(flow.map((event) => event.eventType).sort()).toEqual([...names].sort());
    expect(root.causationId).toBeNull();
    for (let i = 1; i < names.length; i++) {
      const current = flow.find((event) => event.eventType === names[i]);
      const parent = flow.find((event) => event.eventType === names[i - 1]);
      expect(current).toMatchObject({ correlationId: root.correlationId, causationId: parent?.eventId });
    }
    const finalType = decline ? "inventory.released" : "order.confirmed";
    const before = events.filter((event) => event.data.orderId === order.id && event.eventType === finalType).length;
    for (const event of flow.filter((event) => ["order.created", "inventory.reserved", "payment.succeeded", "payment.failed", "order.cancelled"].includes(event.eventType))) {
      await publisher.publish(DOMAIN_EXCHANGE, event.eventType, serializeIntegrationEvent(event));
    }
    await vi.waitFor(async () => {
      await audit();
      expect(events.filter((event) => event.data.orderId === order.id && event.eventType === finalType).length).toBeGreaterThan(before);
    }, { timeout: 10000, interval: 100 });
    expect(scalar("order_test_db", `SELECT count(*) FROM "Order" WHERE "id"='${order.id}'`)).toBe(1);
    expect(scalar("inventory_test_db", `SELECT count(*) FROM "InventoryOperation" WHERE "operationId"='${order.id}:reserve:${productId}'`)).toBe(1);
    expect(scalar("inventory_test_db", `SELECT count(*) FROM "InventoryOperation" WHERE "operationId"='${order.id}:release:${productId}'`)).toBe(decline ? 1 : 0);
    expect(scalar("payment_test_db", `SELECT count(*) FROM "Payment" WHERE "orderId"='${order.id}'`)).toBe(1);
    expect(scalar("payment_test_db", `SELECT count(*) FROM "FakeProviderOperation" f JOIN "Payment" p ON f."idempotencyKey"=p."id"||':settle' WHERE p."orderId"='${order.id}'`)).toBe(1);
    expect(saga(order.id).state).toBe(decline ? "COMPENSATED" : "COMPLETED");
    for (const queue of DOMAIN_QUEUES) expect((await channel.checkQueue(`${queue.name}.dlq`)).messageCount).toBe(0);
  }, 40000);

  it("insufficient stock cancels without creating Payment; duplicate failure remains harmless", async () => {
    const { customer, productId, order } = await setup(0);
    await vi.waitFor(async () => {
      expect(orderSchema.parse(await json("GET", `/order/orders/${order.id}`, customer.accessToken)).status).toBe("CANCELLED");
      await audit();
      expect(events.some((event) => event.data.orderId === order.id && event.eventType === "order.cancelled")).toBe(true);
    }, { timeout: 20000, interval: 100 });
    const flow = events.filter((event) => event.data.orderId === order.id);
    const failure = flow.find((event) => event.eventType === "inventory.reservation_failed");
    if (!failure) throw new Error("Failure event missing");
    await publisher.publish(DOMAIN_EXCHANGE, failure.eventType, serializeIntegrationEvent(failure));
    expect(await json("GET", `/inventory/products/${productId}`, admin)).toMatchObject({ stock: 0, reservedStock: 0 });
    expect(scalar("payment_test_db", `SELECT count(*) FROM "Payment" WHERE "orderId"='${order.id}'`)).toBe(0);
    expect(scalar("inventory_test_db", `SELECT count(*) FROM "InventoryOperation" WHERE "operationId" LIKE '${order.id}:%'`)).toBe(0);
    expect(saga(order.id).state).toBe("CANCELLED");
    for (const queue of DOMAIN_QUEUES) expect((await channel.checkQueue(`${queue.name}.dlq`)).messageCount).toBe(0);
  }, 30000);

  if (!decline) it("recovers acknowledged payment after business-invalid confirmation using one refund and release", async () => {
    const { customer, productId } = await catalog(10);
    const userId = z.string().uuid().parse(customer.user.id);
    const orderId = randomUUID();
    const paymentId = randomUUID();
    const correlationId = randomUUID();
    // Crash-window fixture: financial acknowledgement exists, but confirmation lost to cancellation.
    sql("order_test_db", `INSERT INTO "Order" ("id","userId","status","totalAmount","eventDriven","updatedAt") VALUES ('${orderId}','${userId}','CANCELLED',30,true,NOW());
      INSERT INTO "OrderItem" ("id","orderId","productId","productName","productSlug","quantity","unitPrice","subtotal","updatedAt") VALUES ('${randomUUID()}','${orderId}','${productId}','Protein','protein',3,10,30,NOW());
      INSERT INTO "CheckoutSaga" ("id","orderId","state","correlationId","inventoryReserved","updatedAt") VALUES ('${randomUUID()}','${orderId}','PAYING','${correlationId}',true,NOW());`);
    sql("inventory_test_db", `UPDATE "Inventory" SET "reservedStock"=3 WHERE "productId"='${productId}';
      INSERT INTO "InventoryOperation" ("id","operationId","productId","type","quantity") VALUES ('${randomUUID()}','${orderId}:reserve:${productId}','${productId}','RESERVE',3);`);
    const fingerprint = createHash("sha256").update(JSON.stringify({ paymentId, amount: "30.00", currency: "USD", result: "SUCCEEDED" })).digest("hex");
    sql("payment_test_db", `INSERT INTO "Payment" ("id","userId","orderId","amount","currency","status","providerPaymentId","updatedAt") VALUES ('${paymentId}','${userId}','${orderId}',30,'USD','SUCCEEDED','fake_payment_${paymentId}',NOW());
      INSERT INTO "FakeProviderOperation" ("idempotencyKey","requestFingerprint","result","reference") VALUES ('${paymentId}:settle','${fingerprint}','SUCCEEDED','fake_payment_${paymentId}');`);
    const paid = createIntegrationEvent({ eventType: "payment.succeeded", correlationId, causationId: randomUUID(), data: { orderId, paymentId, amount: "30.00", currency: "USD" } });
    await publisher.publish(DOMAIN_EXCHANGE, paid.eventType, serializeIntegrationEvent(paid));
    await vi.waitFor(async () => {
      expect(saga(orderId)).toMatchObject({ state: "COMPENSATED", paymentOutcome: "REFUNDED", inventoryReleased: true });
      expect(await json("GET", `/inventory/products/${productId}`, admin)).toMatchObject({ reservedStock: 0 });
    }, { timeout: 20000, interval: 100 });
    await publisher.publish(DOMAIN_EXCHANGE, paid.eventType, serializeIntegrationEvent(paid));
    expect(scalar("payment_test_db", `SELECT count(*) FROM "FakeProviderOperation" WHERE "idempotencyKey"='${paymentId}:refund'`)).toBe(1);
    expect(scalar("inventory_test_db", `SELECT count(*) FROM "InventoryOperation" WHERE "operationId"='${orderId}:release:${productId}'`)).toBe(1);
    await audit();
    const flow = events.filter((event) => event.data.orderId === orderId);
    for (const name of ["checkout.refund_requested", "payment.refunded", "order.cancelled", "inventory.released"]) expect(flow.some((event) => event.eventType === name)).toBe(true);
    expect(flow.every((event) => event.correlationId === correlationId)).toBe(true);
  }, 30000);
});
