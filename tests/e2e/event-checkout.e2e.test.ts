import { execFileSync } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createLogger, deserializeIntegrationEvent, serializeIntegrationEvent, openRabbitMq, readRabbitMqConfig,
  createIntegrationEvent, DOMAIN_EXCHANGE, DEAD_LETTER_EXCHANGE, DOMAIN_QUEUES, inspectDlq, replayDlq, type KnownIntegrationEvent } from "@shared/utils";

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
const transportTraces = new Map<string, string>();

async function json(method: string, path: string, token?: string, body?: unknown, key?: string): Promise<unknown> {
  const response = await fetch(`${url}${path}`, { method,
    signal: AbortSignal.timeout(5000),
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...(key ? { "Idempotency-Key": key } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${await response.text()}`);
  if (method === "POST" && path.startsWith("/order/")) expect(response.status).toBe(201);
  return response.json();
}

function sql(database: string, query: string): string {
  const result = execFileSync("docker", ["compose", "-p", "fitsupply-e2e", "-f", "docker-compose.test.yml", "exec", "-T", "postgres-test",
    "psql", "-U", "fitsupply_test", "-d", database, "-At", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8", timeout: 10000 });
  return result.trim();
}
const scalar = (database: string, query: string) => z.coerce.number().int().parse(sql(database, query));
const saga = (orderId: string) => z.object({ state: z.string(), inventoryReleased: z.boolean(), paymentOutcome: z.string().nullable() })
  .parse(JSON.parse(sql("order_test_db", `SELECT row_to_json(s) FROM "CheckoutSaga" s WHERE "orderId"='${orderId}'`)));

async function audit() {
  for (let i = 0; i < 500; i++) {
    const message = await channel.get(auditQueue, { noAck: true });
    if (!message) break;
    const event = deserializeIntegrationEvent(message.content);
    events.push(event);
    const traceparent: unknown = message.properties.headers?.traceparent;
    if (typeof traceparent === "string") transportTraces.set(event.eventId, traceparent);
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

async function openAudit() {
  const config = readRabbitMqConfig();
  const endpoint = new URL(config.url);
  if (endpoint.hostname !== "localhost" || endpoint.port !== "5674" || endpoint.username !== "fitsupply_test") throw new Error("Async E2E requires isolated broker localhost:5674");
  broker = await openRabbitMq(config, createLogger({ service: "async-e2e", environment: "test", level: "silent" }));
  channel = await broker.createChannel();
  auditQueue = (await channel.assertQueue("", { exclusive: true, autoDelete: true })).queue;
  for (const binding of ["order.*", "inventory.*", "payment.*", "checkout.*"]) await channel.bindQueue(auditQueue, DOMAIN_EXCHANGE, binding);
  publisher = await broker.createPublisher();
}
beforeAll(async () => {
  if (process.env.EVENT_DRIVEN_CHECKOUT !== "true") throw new Error("Async E2E requires event-driven test stack");
  await openAudit();
  admin = z.object({ accessToken: z.string() }).parse(await json("POST", "/auth/login", undefined,
    { email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD })).accessToken;
}, 20000);
beforeEach(() => { events.length = 0; transportTraces.clear(); });
afterAll(async () => { if (broker) await broker.close(); });

describe("event-driven HTTP checkout", () => {
  it("all nine deployed services expose authorized metrics with their own service identity", () => {
    const targets = ["api-gateway", "auth-service", "catalog-service", "order-service", "inventory-service", "cart-service", "payment-service", "shipping-service", "notification-service"];
    for (const [offset, service] of targets.entries()) {
      const output = execFileSync("docker", ["compose", "-p", "fitsupply-e2e", "-f", "docker-compose.test.yml", "exec", "-T", service,
        "node", "--input-type=module", "-e", `const url = 'http://localhost:${3000 + offset}/metrics';
          const denied = await fetch(url, { signal: AbortSignal.timeout(5000) }); if (denied.status !== 403) throw new Error('Metrics must be internal');
          const response = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { 'x-internal-secret': process.env.GATEWAY_SECRET } });
          if (response.status !== 200) throw new Error('Metrics scrape failed'); process.stdout.write(await response.text());`], { encoding: "utf8", timeout: 15000 });
      expect(output).toContain(`service="${service}"`);
      expect(output).toContain("process_cpu_user_seconds_total");
      expect(output).not.toContain("fitsupply_test_internal_secret");
    }
  }, 20000);
  it(decline ? "provider decline cancels Order and releases stock once under duplicate delivery" : "confirms Order and charges/reserves once under duplicate delivery", async () => {
    const fixture = await setup(10);
    const { customer, productId, order } = fixture;
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
    // Persisted metadata survives every Outbox hop without changing canonical bytes.
    for (const event of flow) {
      expect(transportTraces.get(event.eventId)).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
      const database = event.producer.service === "inventory-service" ? "inventory_test_db" : event.producer.service === "payment-service" ? "payment_test_db" : "order_test_db";
      expect(sql(database, `SELECT "traceparent" FROM "OutboxEvent" WHERE "eventId"='${event.eventId}'`)).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
      expect(event).not.toHaveProperty("traceparent");
    }
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
    const terminalEvent = flow.find((event) => event.eventType === finalType);
    if (!terminalEvent) throw new Error("Terminal event missing");
    // Confirm-before-marker crash window: durable row retries same event, not a new effect.
    const terminalDatabase = decline ? "inventory_test_db" : "order_test_db";
    sql(terminalDatabase, `UPDATE "OutboxEvent" SET "publishedAt"=NULL, "nextAttemptAt"=NOW() WHERE "eventId"='${terminalEvent.eventId}'`);
    await vi.waitFor(async () => {
      await audit();
      expect(events.filter((event) => event.data.orderId === order.id && event.eventType === finalType).length).toBeGreaterThan(before);
      expect(scalar(terminalDatabase, `SELECT count(*) FROM "OutboxEvent" WHERE "eventId"='${terminalEvent.eventId}' AND "publishedAt" IS NOT NULL`)).toBe(1);
    }, { timeout: 10000, interval: 100 });
    expect(new Set(events.filter((event) => event.data.orderId === order.id && event.eventType === finalType).map((event) => event.eventId))).toEqual(new Set([terminalEvent.eventId]));
    expect(scalar("order_test_db", `SELECT count(*) FROM "Order" WHERE "id"='${order.id}'`)).toBe(1);
    expect(scalar("inventory_test_db", `SELECT count(*) FROM "InventoryOperation" WHERE "operationId"='${order.id}:reserve:${productId}'`)).toBe(1);
    expect(scalar("inventory_test_db", `SELECT count(*) FROM "InventoryOperation" WHERE "operationId"='${order.id}:release:${productId}'`)).toBe(decline ? 1 : 0);
    expect(scalar("payment_test_db", `SELECT count(*) FROM "Payment" WHERE "orderId"='${order.id}'`)).toBe(1);
    expect(scalar("payment_test_db", `SELECT count(*) FROM "FakeProviderOperation" f JOIN "Payment" p ON f."idempotencyKey"=p."id"||':settle' WHERE p."orderId"='${order.id}'`)).toBe(1);
    expect(saga(order.id).state).toBe(decline ? "COMPENSATED" : "COMPLETED");
    const notificationEvent = flow.find((event) => event.eventType === (decline ? "order.cancelled" : "order.confirmed"));
    if (!notificationEvent) throw new Error("Notification source event missing");
    await publisher.publish(DOMAIN_EXCHANGE, notificationEvent.eventType, serializeIntegrationEvent(notificationEvent));
    await vi.waitFor(() => {
      expect(scalar("notification_test_db", `SELECT count(*) FROM "CheckoutEvent" WHERE "eventId"='${notificationEvent.eventId}'`)).toBe(1);
      expect(scalar("notification_test_db", `SELECT count(*) FROM "Notification" WHERE "sourceEventId"='${notificationEvent.eventId}'`)).toBe(1);
      expect(scalar("notification_test_db", `SELECT count(*) FROM "NotificationDelivery" d JOIN "Notification" n ON n.id=d."notificationId"
        WHERE n."sourceEventId"='${notificationEvent.eventId}' AND d.status='SENT' AND d."attemptCount"=1`)).toBe(1);
      expect(scalar("notification_test_db", `SELECT count(*) FROM "FakeEmailReceipt" f JOIN "NotificationDelivery" d ON f."deliveryKey"='delivery:'||d.id
        JOIN "Notification" n ON n.id=d."notificationId" WHERE n."sourceEventId"='${notificationEvent.eventId}' AND f."messageId"=d."providerMessageId"`)).toBe(1);
      expect(sql("notification_test_db", `SELECT "traceparent" FROM "Notification" WHERE "sourceEventId"='${notificationEvent.eventId}'`)).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
    }, { timeout: 10000, interval: 100 });
    for (const queue of DOMAIN_QUEUES) expect((await channel.checkQueue(`${queue.name}.dlq`)).messageCount).toBe(0);
    await verifyOperatorReplay(fixture);
  }, 40000);

  async function verifyOperatorReplay(fixture: Awaited<ReturnType<typeof setup>>) {
    const { customer, productId, order } = fixture;
    await vi.waitFor(async () => {
      expect(saga(order.id).state).toBe(decline ? "COMPENSATED" : "COMPLETED");
      await audit();
      expect(events.some((event) => event.data.orderId === order.id && event.eventType === (decline ? "inventory.released" : "order.confirmed"))).toBe(true);
    }, { timeout: 20000, interval: 100 });
    const targets = [
      { queue: "inventory.order-created", database: "inventory_test_db", type: "order.created" },
      { queue: "payment.inventory-reserved", database: "payment_test_db", type: "checkout.payment_requested" },
      { queue: "order.payment-events", database: "order_test_db", type: decline ? "payment.failed" : "payment.succeeded" },
    ];
    const beforeOutbox = new Map<string, { eventId: string; count: number }>();
    for (const target of targets) {
      const event = events.find((entry) => entry.data.orderId === order.id && entry.eventType === target.type);
      if (!event) throw new Error("Required recovery fact missing");
      const bytes = serializeIntegrationEvent(event);
      const before = scalar(target.database, `SELECT count(*) FROM "OutboxEvent" WHERE "payload"::jsonb->>'causationId'='${event.eventId}'`);
      beforeOutbox.set(target.queue, { eventId: event.eventId, count: before });
      for (let i = 0; i < 2; i++) await publisher.publish(DEAD_LETTER_EXCHANGE, target.queue, bytes);
      const record = (await inspectDlq(broker, `${target.queue}.dlq`)).find((entry) => entry.event?.eventId === event.eventId);
      if (!record) throw new Error("Selected quarantine fact missing");
      for (let i = 0; i < 2; i++) await replayDlq(broker, `${target.queue}.dlq`, record.id, record.id);
      expect(scalar(target.database, `SELECT count(*) FROM "OutboxEvent" WHERE "payload"::jsonb->>'causationId'='${event.eventId}'`)).toBe(before);
    }
    // Broker messages includes ready + unacknowledged: wait for actual consumer ACKs.
    await vi.waitFor(() => {
      const output = execFileSync("docker", ["compose", "-p", "fitsupply-e2e", "-f", "docker-compose.test.yml", "exec", "-T", "rabbitmq-test",
        "rabbitmqctl", "-q", "list_queues", "name", "messages"], { encoding: "utf8" });
      const counts = new Map(output.trim().split(/\r?\n/).map((line) => { const [name, count] = line.trim().split(/\s+/); return [name, count] as const; }));
      for (const target of targets) expect(counts.get(target.queue)).toBe("0");
    }, { timeout: 15000, interval: 100 });
    for (const target of targets) {
      const before = beforeOutbox.get(target.queue)!;
      expect(scalar(target.database, `SELECT count(*) FROM "OutboxEvent" WHERE "payload"::jsonb->>'causationId'='${before.eventId}'`)).toBe(before.count);
    }
    expect(orderSchema.parse(await json("GET", `/order/orders/${order.id}`, customer.accessToken)).status).toBe(decline ? "CANCELLED" : "CONFIRMED");
    expect(await json("GET", `/inventory/products/${productId}`, admin)).toMatchObject({ reservedStock: decline ? 0 : 3 });
    expect(scalar("inventory_test_db", `SELECT count(*) FROM "InventoryOperation" WHERE "operationId"='${order.id}:reserve:${productId}'`)).toBe(1);
    expect(scalar("payment_test_db", `SELECT count(*) FROM "Payment" WHERE "orderId"='${order.id}'`)).toBe(1);
    expect(scalar("payment_test_db", `SELECT count(*) FROM "FakeProviderOperation" f JOIN "Payment" p ON f."idempotencyKey"=p."id"||':settle' WHERE p."orderId"='${order.id}'`)).toBe(1);
    for (const target of targets) expect((await channel.checkQueue(`${target.queue}.dlq`)).messageCount).toBe(0);
  }

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
  if (!decline) it("recovers committed Outbox after Order process crash and broker outage without client replay", async () => {
    const { customer, productId, suffix } = await catalog(10);
    const compose = ["compose", "-p", "fitsupply-e2e", "-f", "docker-compose.test.yml"];
    await broker.close();
    execFileSync("docker", [...compose, "stop", "rabbitmq-test"], { stdio: "pipe" });
    let order: z.infer<typeof orderSchema>;
    let killed = false;
    const started = execFileSync("docker", ["inspect", "--format", "{{.State.StartedAt}}", "fitsupply-stack-order-service-test"], { encoding: "utf8" });
    try {
      order = orderSchema.parse(await json("POST", "/order/orders", customer.accessToken, {
        items: [{ productId, quantity: 3 }], delivery: {
          recipientName: "Recovery Customer", contactPhone: "+358401234567", addressLine1: "Testikatu 1", city: "Helsinki", postalCode: "00100", countryCode: "FI",
        },
      }, `outbox:${suffix}`));
      expect(order.status).toBe("PENDING");
      expect(saga(order.id).state).toBe("RESERVING");
      expect(scalar("order_test_db", `SELECT count(*) FROM "OutboxEvent" WHERE "payload"::jsonb->>'eventType'='order.created' AND "payload"::jsonb->'data'->>'orderId'='${order.id}' AND "publishedAt" IS NULL`)).toBe(1);
      expect(scalar("payment_test_db", `SELECT count(*) FROM "Payment" WHERE "orderId"='${order.id}'`)).toBe(0);
      execFileSync("docker", [...compose, "kill", "--signal", "SIGKILL", "order-service"], { stdio: "pipe" });
      killed = true;
      expect(scalar("order_test_db", `SELECT count(*) FROM "OutboxEvent" WHERE "payload"::jsonb->'data'->>'orderId'='${order.id}' AND "publishedAt" IS NULL`)).toBe(1);
    } finally {
      execFileSync("docker", [...compose, "start", "--wait", "--wait-timeout", "60", "rabbitmq-test"], { stdio: "pipe" });
      if (killed) execFileSync("docker", [...compose, "start", "--wait", "--wait-timeout", "60", "order-service"], { stdio: "pipe" });
      await openAudit();
    }
    expect(execFileSync("docker", ["inspect", "--format", "{{.State.StartedAt}}", "fitsupply-stack-order-service-test"], { encoding: "utf8" })).not.toBe(started);
    await vi.waitFor(async () => {
      expect(saga(order.id).state).toBe("COMPLETED");
      expect(scalar("order_test_db", `SELECT count(*) FROM "OutboxEvent" WHERE "payload"::jsonb->>'eventType'='order.created' AND "payload"::jsonb->'data'->>'orderId'='${order.id}' AND "publishedAt" IS NOT NULL`)).toBe(1);
      expect(await json("GET", `/inventory/products/${productId}`, admin)).toMatchObject({ reservedStock: 3 });
    }, { timeout: 30000, interval: 200 });
    expect(scalar("inventory_test_db", `SELECT count(*) FROM "InventoryOperation" WHERE "operationId"='${order.id}:reserve:${productId}'`)).toBe(1);
    expect(scalar("payment_test_db", `SELECT count(*) FROM "Payment" WHERE "orderId"='${order.id}' AND "status"='SUCCEEDED'`)).toBe(1);
    expect(scalar("payment_test_db", `SELECT count(*) FROM "FakeProviderOperation" f JOIN "Payment" p ON f."idempotencyKey"=p."id"||':settle' WHERE p."orderId"='${order.id}'`)).toBe(1);
  }, 90000);
});
