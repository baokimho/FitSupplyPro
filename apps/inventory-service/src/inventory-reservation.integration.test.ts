import express from "express";
import { randomUUID } from "node:crypto";
import { createIntegrationEvent, checkoutMessageHandler, serializeIntegrationEvent, createLogger, processCheckoutEvent, openRabbitMq, readRabbitMqConfig, ServiceUnavailableError, fetchDependency, retryOperation } from "@shared/utils";
import request from "supertest";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { claimDeliveryAttempt, createCheckoutDeliveryHandler, declareRabbitMqTopology, enqueueOutboxEvent, inspectDlq, replayDlq, messageKey, ConflictError, DEAD_LETTER_EXCHANGE } from "@shared/utils";
import type { Channel, GetMessage } from "amqplib";
import {
  buildInventory,
  cleanupDatabase,
  errorHandler,
  requireTestDatabaseUrl,
} from "@shared/utils";
import type { PrismaClient } from "./generated/prisma/index.js";
import type { reserveInventoryStockService as reserveInventoryStockServiceType } from "./services/inventory.service.js";

let prisma: PrismaClient;
let reserveInventoryStockService: typeof reserveInventoryStockServiceType;
let app: express.Express;
let handleInventoryCheckout: typeof import("./services/checkout.service.js").handleInventoryCheckout;

const databaseUrl = requireTestDatabaseUrl("inventory_test_db");

async function getInventory(productId: string) {
  const inventory = await prisma.inventory.findUniqueOrThrow({ where: { productId } });
  return {
    stock: inventory.stock,
    reservedStock: inventory.reservedStock,
    availableStock: inventory.stock - inventory.reservedStock,
  };
}

async function createInventory(overrides: Parameters<typeof buildInventory>[0] = {}) {
  const inventory = buildInventory(overrides);
  await prisma.inventory.create({ data: inventory });
  return inventory;
}

beforeAll(async () => {
  process.env.DATABASE_URL = databaseUrl;
  process.env.GATEWAY_SECRET = "fitsupply_test_internal_secret";

  const dbModule = await import("./config/db.js");
  prisma = dbModule.default;
  ({ reserveInventoryStockService } = await import("./services/inventory.service.js"));
  ({ handleInventoryCheckout } = await import("./services/checkout.service.js"));

  const routes = (await import("./routes/inventory.route.js")).default;
  app = express();
  app.use(express.json());
  app.use(routes);
  app.use(errorHandler);
});

beforeEach(async () => {
  await cleanupDatabase("inventory_test_db", databaseUrl, {
    async execute(sql) {
      await prisma.$executeRawUnsafe(sql);
    },
  });
});

describe("async Inventory checkout", () => {
  const creation = (items: { productId: string; quantity: number }[]) => createIntegrationEvent({
    eventType: "order.created", correlationId: randomUUID(), causationId: null,
    data: { orderId: randomUUID(), userId: "user", items, totalAmount: "10.00", currency: "USD" },
  });
  it("Inbox primary key rejects duplicate inserts and retains incoming type and processing time", async () => {
    const input = creation([{ productId: randomUUID(), quantity: 1 }]);
    await prisma.$transaction((tx) => processCheckoutEvent(tx, input, async () => null));
    const row = await prisma.checkoutEvent.findUniqueOrThrow({ where: { eventId: input.eventId } });
    expect(row).toMatchObject({ eventType: input.eventType, processedAt: expect.any(Date), result: null });
    await expect(prisma.checkoutEvent.create({ data: { ...row } })).rejects.toMatchObject({ code: "P2002" });
  });
  it("concurrent Inbox deliveries execute one DB mutation and stage one outgoing intent", async () => {
    const productId = randomUUID();
    await createInventory({ productId, stock: 10 });
    const input = creation([{ productId, quantity: 1 }]);
    const run = () => prisma.$transaction((tx) => processCheckoutEvent(tx, input, async () => {
      await tx.inventory.update({ where: { productId }, data: { reservedStock: { increment: 1 } } });
      return createIntegrationEvent({ eventType: "inventory.reserved", correlationId: input.correlationId,
        causationId: input.eventId, data: { orderId: input.data.orderId, reservations: input.data.items } });
    }));
    const results = await Promise.all([run(), run()]);
    expect(results[1]).toEqual(results[0]);
    expect(await getInventory(productId)).toMatchObject({ reservedStock: 1 });
    expect(await prisma.checkoutEvent.count({ where: { eventId: input.eventId } })).toBe(1);
    expect(await prisma.outboxEvent.count({ where: { eventId: results[0]!.eventId } })).toBe(1);
  });
  it("real broker redelivery after commit before ACK replays Inbox and ACKs without repeating effects", async () => {
    const productId = randomUUID();
    await createInventory({ productId, stock: 10 });
    const input = creation([{ productId, quantity: 3 }]);
    const logs: string[] = [];
    const logger = createLogger({ service: "inbox-recovery-test", environment: "test", level: "debug" }, {
      write(line: string) { logs.push(line); },
    });
    const config = readRabbitMqConfig();
    const url = new URL(config.url);
    if (url.hostname !== "localhost" || url.port !== "5673" || url.username !== "fitsupply_test" || url.pathname) {
      throw new Error("Inbox recovery requires disposable localhost:5673 broker");
    }
    const broker = await openRabbitMq(config, logger);
    try {
      const channel = await broker.createChannel();
      const { queue } = await channel.assertQueue("", { exclusive: true });
      const publisher = await broker.createPublisher();
      await publisher.publish("", queue, serializeIntegrationEvent(input));
      await vi.waitFor(async () => expect((await channel.checkQueue(queue)).messageCount).toBe(1));
      const delivery = await channel.get(queue, { noAck: false });
      if (!delivery) throw new Error("Missing test delivery");
      const output = await handleInventoryCheckout(input);
      expect(await prisma.checkoutEvent.findUnique({ where: { eventId: input.eventId } })).not.toBeNull();
      expect(await prisma.outboxEvent.findUnique({ where: { eventId: output!.eventId } })).not.toBeNull();
      // No ACK: closing the delivery channel simulates the post-commit crash window.
      await channel.close();
      const process = checkoutMessageHandler(["order.created"], handleInventoryCheckout, async () => {}, logger);
      await broker.subscribe(queue, async (message) => {
        expect(message.fields.redelivered).toBe(true);
        await process(message.content);
      });
      await vi.waitFor(() => expect(logs.some((line) => JSON.parse(line).msg === "broker message acknowledged")).toBe(true));
      expect(await getInventory(productId)).toMatchObject({ reservedStock: 3 });
      expect(await prisma.inventoryOperation.count()).toBe(1);
      expect(await prisma.checkoutEvent.count({ where: { eventId: input.eventId } })).toBe(1);
      expect(await prisma.outboxEvent.count({ where: { eventId: output!.eventId } })).toBe(1);
    } finally { await broker.close(); }
  });
  it("receipt failure rolls back Inventory operation and Outbox; redelivery executes normally", async () => {
    const outboxCount = await prisma.outboxEvent.count();
    const productId = randomUUID();
    await createInventory({ productId, stock: 10 });
    const input = creation([{ productId, quantity: 3 }]);
    await prisma.$executeRawUnsafe(`CREATE FUNCTION inbox_test_receipt_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'inbox receipt unavailable'; END; $$`);
    await prisma.$executeRawUnsafe('CREATE TRIGGER inbox_test_receipt_failure BEFORE INSERT ON "CheckoutEvent" FOR EACH ROW EXECUTE FUNCTION inbox_test_receipt_failure()');
    try {
      await expect(handleInventoryCheckout(input)).rejects.toThrow("inbox receipt unavailable");
      expect(await getInventory(productId)).toMatchObject({ reservedStock: 0 });
      expect(await prisma.inventoryOperation.count()).toBe(0);
      expect(await prisma.checkoutEvent.findUnique({ where: { eventId: input.eventId } })).toBeNull();
      expect(await prisma.outboxEvent.count()).toBe(outboxCount);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER inbox_test_receipt_failure ON "CheckoutEvent"');
      await prisma.$executeRawUnsafe('DROP FUNCTION inbox_test_receipt_failure()');
    }
    await handleInventoryCheckout(input);
    expect(await getInventory(productId)).toMatchObject({ reservedStock: 3 });
    expect(await prisma.inventoryOperation.count()).toBe(1);
    expect(await prisma.outboxEvent.count()).toBe(outboxCount + 1);
  });
  it("failed release publishes diagnosis without completing receipt; repaired replay releases once", async () => {
    const productId = randomUUID();
    await createInventory({ productId, stock: 10 });
    const input = creation([{ productId, quantity: 3 }]);
    await handleInventoryCheckout(input);
    const cancel = createIntegrationEvent({ eventType: "order.cancelled", correlationId: input.correlationId, causationId: input.eventId,
      data: { orderId: input.data.orderId, userId: "user", items: input.data.items } });
    const { inventoryCompensationFailure } = await import("./services/checkout.service.js");
    const published: string[] = [];
    const process = checkoutMessageHandler(["order.cancelled"], handleInventoryCheckout, async (event) => { published.push(event.eventType); },
      createLogger({ service: "test", environment: "test", level: "silent" }), inventoryCompensationFailure);
    await prisma.$executeRawUnsafe(`CREATE FUNCTION saga_test_release() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW."reservedStock"<OLD."reservedStock" THEN RAISE EXCEPTION 'release DB unavailable'; END IF; RETURN NEW; END; $$`);
    await prisma.$executeRawUnsafe('CREATE TRIGGER saga_test_release BEFORE UPDATE ON "Inventory" FOR EACH ROW EXECUTE FUNCTION saga_test_release()');
    try {
      await expect(process(serializeIntegrationEvent(cancel))).rejects.toThrow("release DB unavailable");
      expect(published).toEqual(["inventory.release_failed"]);
      expect(await prisma.checkoutEvent.findUnique({ where: { eventId: cancel.eventId } })).toBeNull();
      expect((await getInventory(productId)).reservedStock).toBe(3);
    } finally {
      await prisma.$executeRawUnsafe('DROP TRIGGER saga_test_release ON "Inventory"');
      await prisma.$executeRawUnsafe('DROP FUNCTION saga_test_release()');
    }
    await process(serializeIntegrationEvent(cancel));
    expect(published).toEqual(["inventory.release_failed", "inventory.released"]);
    expect(await getInventory(productId)).toMatchObject({ reservedStock: 0 });
    expect(await prisma.inventoryOperation.count()).toBe(2);
  });
  it("concurrent redelivery and publish retry reserve once and replay same result", async () => {
    const productId = randomUUID();
    await createInventory({ productId, stock: 10 });
    const input = creation([{ productId, quantity: 3 }]);
    const results = await Promise.all([handleInventoryCheckout(input), handleInventoryCheckout(input)]);
    expect(results[0]).toEqual(results[1]);
    let publications = 0;
    const publish = async () => { if (++publications === 1) throw new ServiceUnavailableError("publish unavailable after commit"); };
    await checkoutMessageHandler(["order.created"], handleInventoryCheckout, publish,
      createLogger({ service: "test", environment: "test", level: "silent" }))(serializeIntegrationEvent(input));
    expect(publications).toBe(2);
    expect(await getInventory(productId)).toMatchObject({ reservedStock: 3 });
    expect(await prisma.inventoryOperation.count()).toBe(1);
    const result = results[0];
    expect(result).toMatchObject({ eventType: "inventory.reserved", correlationId: input.correlationId, causationId: input.eventId });
    expect(await prisma.outboxEvent.findUnique({ where: { eventId: result!.eventId } })).toMatchObject({ publishedAt: null });
    await expect(handleInventoryCheckout({ ...input, data: { ...input.data, totalAmount: "11.00" } })).rejects.toThrow("Event ID reused");
  });
  it("rolls back entire multi-product batch on insufficient/missing stock; duplicate failure is stable", async () => {
    const ids = [randomUUID(), randomUUID()].sort();
    await createInventory({ productId: ids[0], stock: 10 });
    await createInventory({ productId: ids[1], stock: 0 });
    const input = creation(ids.map((productId) => ({ productId, quantity: 2 })));
    const first = await handleInventoryCheckout(input);
    expect(first?.eventType).toBe("inventory.reservation_failed");
    expect(await prisma.outboxEvent.findUnique({ where: { eventId: first!.eventId } })).toMatchObject({ publishedAt: null });
    expect(await handleInventoryCheckout(input)).toEqual(first);
    expect(await getInventory(ids[0])).toMatchObject({ reservedStock: 0 });
    expect(await prisma.inventoryOperation.count()).toBe(0);
    const missing = await handleInventoryCheckout(creation([{ productId: randomUUID(), quantity: 1 }]));
    expect(missing?.data).toMatchObject({ reason: "PRODUCT_NOT_FOUND" });
  });
  it("duplicate cancellations release once and cannot release another order's stock", async () => {
    const productId = randomUUID();
    await createInventory({ productId, stock: 10 });
    const input = creation([{ productId, quantity: 3 }]);
    await handleInventoryCheckout(input);
    const cancel = createIntegrationEvent({ eventType: "order.cancelled", correlationId: input.correlationId, causationId: input.eventId,
      data: { orderId: input.data.orderId, userId: "user", items: input.data.items } });
    const [released, concurrent] = await Promise.all([handleInventoryCheckout(cancel), handleInventoryCheckout(cancel)]);
    expect(concurrent).toEqual(released);
    expect(released?.eventType).toBe("inventory.released");
    expect(await prisma.outboxEvent.findUnique({ where: { eventId: released!.eventId } })).toMatchObject({ publishedAt: null });
    expect(await handleInventoryCheckout(cancel)).toEqual(released);
    expect(await prisma.outboxEvent.count({ where: { eventId: released!.eventId } })).toBe(1);
    expect(await getInventory(productId)).toMatchObject({ stock: 10, reservedStock: 0 });
    expect(await prisma.inventoryOperation.count()).toBe(2);
    const unrelated = createIntegrationEvent({ eventType: "order.cancelled", correlationId: randomUUID(), causationId: null,
      data: { ...cancel.data, orderId: randomUUID() } });
    expect(await handleInventoryCheckout(unrelated)).toBeNull();
  });
});

describe("resilient Inventory boundaries", () => {
  it("real HTTP timeout after committed reserve reuses operationId and mutates stock once", async () => {
    const productId = randomUUID();
    await createInventory({ productId, stock: 10 });
    const operationId = randomUUID();
    const identities: string[] = [];
    let attempts = 0;
    const remote = express();
    remote.use(express.json());
    remote.post("/reserve", async (req, res) => {
      attempts++;
      const body = req.body as { quantity: number; operationId: string };
      identities.push(body.operationId);
      const result = await reserveInventoryStockService(productId, { ...body, reason: "Resilience recovery test" });
      if (attempts === 1) { res.writeHead(200); res.write("{"); }
      else res.json(result);
    });
    const server = remote.listen(0, "127.0.0.1");
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing test address");
    const logger = createLogger({ service: "inventory-timeout-test", environment: "test", level: "silent" });
    try {
      const result = await retryOperation(() => fetchDependency(`http://127.0.0.1:${address.port}/reserve`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ quantity: 3, operationId }),
      }, { dependency: "inventory", operation: "reserve", safe: true, timeoutMs: 200, logger }), {
        dependency: "inventory", operation: "reserve", safe: true, maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 1, logger,
      });
      expect(result.response.ok).toBe(true);
      expect(identities).toEqual([operationId, operationId]);
      expect(await getInventory(productId)).toMatchObject({ reservedStock: 3 });
      expect(await prisma.inventoryOperation.count({ where: { operationId } })).toBe(1);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });
  it("transient PostgreSQL rollback retries same incoming event and commits one Inbox/Outbox effect", async () => {
    const productId = randomUUID();
    await createInventory({ productId, stock: 10 });
    const event = createIntegrationEvent({ eventType: "order.created", correlationId: randomUUID(), causationId: null,
      data: { orderId: randomUUID(), userId: "user", items: [{ productId, quantity: 3 }], totalAmount: "10.00", currency: "USD" } });
    await prisma.$executeRawUnsafe('CREATE SEQUENCE resilience_test_failure');
    await prisma.$executeRawUnsafe(`CREATE FUNCTION resilience_test_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF nextval('resilience_test_failure')=1 THEN RAISE EXCEPTION 'temporary serialization failure' USING ERRCODE='40001'; END IF; RETURN NEW; END; $$`);
    await prisma.$executeRawUnsafe('CREATE TRIGGER resilience_test_failure BEFORE UPDATE ON "Inventory" FOR EACH ROW EXECUTE FUNCTION resilience_test_failure()');
    const logs: string[] = [];
    const logger = createLogger({ service: "inventory-retry-test", environment: "test", level: "debug" }, { write(line: string) { logs.push(line); } });
    const broker = await openRabbitMq(readRabbitMqConfig(), logger);
    let attempts = 0;
    try {
      const process = checkoutMessageHandler(["order.created"], async (input) => {
        attempts++; expect(input.eventId).toBe(event.eventId);
        return handleInventoryCheckout(input);
      }, async () => {}, logger, undefined, { policy: { maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 1 } });
      const channel = await broker.createChannel();
      const { queue } = await channel.assertQueue("", { exclusive: true });
      await broker.subscribe(queue, (message) => process(message.content));
      const publisher = await broker.createPublisher();
      await publisher.publish("", queue, serializeIntegrationEvent(event));
      await vi.waitFor(() => expect(logs.some((line) => JSON.parse(line).msg === "broker message acknowledged")).toBe(true));
      expect(attempts).toBe(2);
      await process(serializeIntegrationEvent(event));
      expect(await getInventory(productId)).toMatchObject({ reservedStock: 3 });
      expect(await prisma.inventoryOperation.count()).toBe(1);
      const receipt = await prisma.checkoutEvent.findUniqueOrThrow({ where: { eventId: event.eventId } });
      const result = JSON.parse(receipt.result!) as { eventId: string };
      expect(await prisma.outboxEvent.count({ where: { eventId: result.eventId } })).toBe(1);
    } finally {
      await broker.close();
      await prisma.$executeRawUnsafe('DROP TRIGGER resilience_test_failure ON "Inventory"');
      await prisma.$executeRawUnsafe('DROP FUNCTION resilience_test_failure()');
      await prisma.$executeRawUnsafe('DROP SEQUENCE resilience_test_failure');
    }
  });
});

describe("durable delivery budgets and operator recovery", () => {
  const queue = "inventory.order-created";
  const dlq = `${queue}.dlq`;
  let broker: Awaited<ReturnType<typeof openRabbitMq>>;
  let channel: Channel;
  let publisher: Awaited<ReturnType<typeof broker.createPublisher>>;
  let logs: string[];
  let logger: ReturnType<typeof createLogger>;
  beforeEach(async () => {
    const config = readRabbitMqConfig();
    const url = new URL(config.url);
    if (url.hostname !== "localhost" || url.port !== "5673" || url.username !== "fitsupply_test") throw new Error("Disposable test broker required");
    logs = [];
    logger = createLogger({ service: "delivery-test", environment: "test", level: "debug" }, { write(line: string) { logs.push(line); } });
    broker = await openRabbitMq(config, logger);
    channel = await broker.createChannel();
    await declareRabbitMqTopology(channel);
    await channel.purgeQueue(queue); await channel.purgeQueue(dlq);
    publisher = await broker.createPublisher();
  });
  afterEach(async () => { await broker?.close(); });
  async function input() {
    const productId = randomUUID();
    await createInventory({ productId, stock: 10 });
    const event = createIntegrationEvent({ eventType: "order.created", correlationId: randomUUID(), causationId: null,
      data: { orderId: randomUUID(), userId: "user", items: [{ productId, quantity: 3 }], totalAmount: "10.00", currency: "USD" } });
    return { productId, event, bytes: serializeIntegrationEvent(event) };
  }
  const delivery = (work = handleInventoryCheckout) => createCheckoutDeliveryHandler(queue, ["order.created", "order.cancelled"], work,
    async (event) => { await prisma.$transaction((tx) => enqueueOutboxEvent(tx, event)); }, logger, prisma);
  async function subscribe(work = handleInventoryCheckout) {
    const process = delivery(work);
    await broker.subscribe(queue, process.handle, 10, (message, error) => process.quarantine(message, error, publisher.publish));
  }
  async function receive(name: string): Promise<GetMessage> {
    let message: GetMessage | false = false;
    await vi.waitFor(async () => { message = await channel.get(name, { noAck: false }); expect(message).not.toBe(false); });
    if (!message) throw new Error("Missing delivery");
    return message;
  }
  async function quarantined() {
    await vi.waitFor(async () => expect((await channel.checkQueue(dlq)).messageCount).toBeGreaterThan(0));
    return (await inspectDlq(broker, dlq, 1))[0];
  }
  it("concurrent durable claims admit only three attempts across workers", async () => {
    const f = await input();
    const key = { consumer: queue, messageKey: messageKey(f.bytes), replayCount: 0 };
    const results = await Promise.allSettled(Array.from({ length: 8 }, () => claimDeliveryAttempt(prisma, key, f.event, 3)));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(3);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(5);
    expect(await prisma.consumerDelivery.findUniqueOrThrow({ where: { consumer_messageKey_replayCount: key } })).toMatchObject({ attempts: 3 });
    expect(await getInventory(f.productId)).toMatchObject({ reservedStock: 0 });
  });
  it("transient failure succeeds within one durable three-attempt budget", async () => {
    const f = await input(); let attempts = 0;
    await subscribe(async (event) => { if (++attempts < 3) throw new ServiceUnavailableError(); return handleInventoryCheckout(event); });
    await publisher.publish("", queue, f.bytes);
    await vi.waitFor(async () => expect(await prisma.checkoutEvent.findUnique({ where: { eventId: f.event.eventId } })).not.toBeNull());
    expect(attempts).toBe(3);
    expect(await getInventory(f.productId)).toMatchObject({ reservedStock: 3 });
    expect((await channel.checkQueue(dlq)).messageCount).toBe(0);
  });
  it("exhaustion quarantines diagnostics; two operator replays preserve identity and one business effect", async () => {
    const f = await input(); let broken = true; let attempts = 0;
    await subscribe(async (event) => { attempts++; if (broken) throw new ServiceUnavailableError("password=private"); return handleInventoryCheckout(event); });
    await publisher.publish("", queue, f.bytes);
    const first = await quarantined();
    expect(first).toMatchObject({ failureClass: "TRANSIENT", attempt: 3, maxAttempts: 3, replayCount: 0,
      event: { eventId: f.event.eventId, correlationId: f.event.correlationId }, replayEligible: true });
    expect(JSON.stringify(first)).not.toContain("private");
    expect(attempts).toBe(3);
    expect(await getInventory(f.productId)).toMatchObject({ reservedStock: 0 });
    // Simulate a duplicate DLQ copy from confirm-before-source-ACK loss.
    const copy = await receive(dlq);
    await publisher.publish(DEAD_LETTER_EXCHANGE, queue, copy.content, copy.properties.headers);
    channel.nack(copy, false, true);
    broken = false;
    await replayDlq(broker, dlq, first.id, first.id);
    await vi.waitFor(async () => expect(await prisma.checkoutEvent.findUnique({ where: { eventId: f.event.eventId } })).not.toBeNull());
    await replayDlq(broker, dlq, first.id, first.id);
    await vi.waitFor(async () => expect((await channel.checkQueue(dlq)).messageCount).toBe(0));
    expect(await getInventory(f.productId)).toMatchObject({ reservedStock: 3 });
    expect(await prisma.inventoryOperation.count()).toBe(1);
    const receipt = await prisma.checkoutEvent.findUniqueOrThrow({ where: { eventId: f.event.eventId } });
    const output = JSON.parse(receipt.result!) as { eventId: string; correlationId: string; causationId: string };
    expect(output).toMatchObject({ correlationId: f.event.correlationId, causationId: f.event.eventId });
    expect(await prisma.outboxEvent.count({ where: { eventId: output.eventId } })).toBe(1);
    const row = await prisma.consumerDelivery.findUniqueOrThrow({ where: { consumer_messageKey_replayCount: { consumer: queue, messageKey: messageKey(f.bytes), replayCount: 1 } } });
    expect(row.attempts).toBe(1);
  });
  it.each(["permanent", "poison", "wrong-handler"])("%s failure quarantines without wasting retry budget", async (kind) => {
    const f = await input(); let calls = 0;
    await subscribe(async () => { calls++; throw new ConflictError("deterministic rejection"); });
    const bytes = kind === "poison" ? Buffer.from("password=private") : kind === "wrong-handler" ? serializeIntegrationEvent(createIntegrationEvent({
      eventType: "order.confirmed", correlationId: f.event.correlationId, causationId: f.event.eventId, data: { orderId: f.event.data.orderId, userId: "user" },
    })) : f.bytes;
    await publisher.publish("", queue, bytes);
    const record = await quarantined();
    expect(record.failureClass).toBe(kind === "permanent" ? "PERMANENT" : "POISON");
    expect(calls).toBe(kind === "permanent" ? 1 : 0);
    expect(record.attempt).toBe(kind === "permanent" ? 1 : 0);
    if (kind !== "permanent") {
      expect(record.replayEligible).toBe(false);
      await expect(replayDlq(broker, dlq, record.id, record.id)).rejects.toThrow();
      expect((await inspectDlq(broker, dlq)).length).toBe(1);
    }
  });
  it("channel redelivery resumes persisted attempt budget instead of resetting it", async () => {
    const f = await input();
    await publisher.publish("", queue, f.bytes);
    const unsettled = await receive(queue);
    await claimDeliveryAttempt(prisma, { consumer: queue, messageKey: messageKey(f.bytes), replayCount: 0 }, f.event, 3);
    await channel.close(); channel = await broker.createChannel();
    let calls = 0;
    const process = delivery(async () => { calls++; throw new ServiceUnavailableError(); });
    await broker.subscribe(queue, async (message) => { expect(message.fields.redelivered).toBe(true); expect(message.content).toEqual(unsettled.content); await process.handle(message); }, 10,
      (message, error) => process.quarantine(message, error, publisher.publish));
    const record = await quarantined();
    expect(record).toMatchObject({ attempt: 3, failureClass: "TRANSIENT" });
    expect(calls).toBe(2);
    await vi.waitFor(async () => expect((await channel.checkQueue(queue)).messageCount).toBe(0));
  });
  it("commit-before-ACK duplicate succeeds even after last durable attempt was spent", async () => {
    const f = await input();
    await publisher.publish("", queue, f.bytes);
    await receive(queue);
    for (let i = 0; i < 3; i++) await claimDeliveryAttempt(prisma, { consumer: queue, messageKey: messageKey(f.bytes), replayCount: 0 }, f.event, 3);
    const result = await handleInventoryCheckout(f.event);
    await channel.close(); channel = await broker.createChannel();
    await subscribe();
    await vi.waitFor(() => expect(logs.some((line) => JSON.parse(line).msg === "broker message acknowledged")).toBe(true));
    expect(await getInventory(f.productId)).toMatchObject({ reservedStock: 3 });
    expect(await prisma.inventoryOperation.count()).toBe(1);
    expect(await prisma.outboxEvent.count({ where: { eventId: result!.eventId } })).toBe(1);
    expect((await channel.checkQueue(dlq)).messageCount).toBe(0);
  });
  it("unconfirmed quarantine keeps source available; restarted consumer does not reset exhausted budget", async () => {
    const f = await input();
    for (let i = 0; i < 3; i++) await claimDeliveryAttempt(prisma, { consumer: queue, messageKey: messageKey(f.bytes), replayCount: 0 }, f.event, 3);
    let calls = 0;
    const process = delivery(async (event) => { calls++; return handleInventoryCheckout(event); });
    await channel.deleteExchange(DEAD_LETTER_EXCHANGE);
    await broker.subscribe(queue, process.handle, 10, (message, error) => process.quarantine(message, error, publisher.publish));
    await publisher.publish("", queue, f.bytes);
    await vi.waitFor(() => expect(broker.isReady()).toBe(false));
    expect(calls).toBe(0);
    await broker.close();
    broker = await openRabbitMq(readRabbitMqConfig(), logger);
    channel = await broker.createChannel();
    expect((await channel.checkQueue(queue)).messageCount).toBe(1);
    await declareRabbitMqTopology(channel);
    publisher = await broker.createPublisher();
    await subscribe(async (event) => { calls++; return handleInventoryCheckout(event); });
    expect(await quarantined()).toMatchObject({ attempt: 3, failureClass: "TRANSIENT" });
    expect(calls).toBe(0);
    expect(await getInventory(f.productId)).toMatchObject({ reservedStock: 0 });
  });
});

describe("reserveInventoryStockService", () => {
  it("reserves stock atomically and returns remaining availability", async () => {
    const inventory = await createInventory({ productId: "reserve-success", stock: 10, reservedStock: 2 });

    const result = await reserveInventoryStockService(inventory.productId, {
      quantity: 3,
      reason: "checkout",
    });

    expect(result).toMatchObject({
      productId: inventory.productId,
      stock: 10,
      reservedStock: 5,
      availableStock: 5,
    });
    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 10,
      reservedStock: 5,
      availableStock: 5,
    });
  });

  it("allows reserving exactly the remaining availability", async () => {
    const inventory = await createInventory({ productId: "reserve-exact", stock: 8, reservedStock: 3 });

    const result = await reserveInventoryStockService(inventory.productId, {
      quantity: 5,
      reason: "checkout",
    });

    expect(result).toMatchObject({ stock: 8, reservedStock: 8, availableStock: 0 });
  });

  it("rejects insufficient availability and leaves state unchanged", async () => {
    const inventory = await createInventory({ productId: "reserve-insufficient", stock: 5, reservedStock: 4 });

    await expect(
      reserveInventoryStockService(inventory.productId, { quantity: 2, reason: "checkout" }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Insufficient stock",
      details: { productId: inventory.productId, availableStock: 1, requestedQuantity: 2 },
    });

    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 5,
      reservedStock: 4,
      availableStock: 1,
    });
  });

  it("returns not found for missing inventory", async () => {
    await expect(
      reserveInventoryStockService("missing-product", { quantity: 1, reason: "checkout" }),
    ).rejects.toMatchObject({ status: 404, message: "Inventory not found" });
  });

  it("rejects invalid quantities before reaching service mutation", async () => {
    const inventory = await createInventory({ productId: "reserve-invalid", stock: 5, reservedStock: 0 });

    await request(app)
      .post(`/products/${inventory.productId}/reserve`)
      .send({ quantity: 0, reason: "checkout" })
      .expect(400);

    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 5,
      reservedStock: 0,
      availableStock: 5,
    });
  });

  it("prevents competing reservations from oversubscribing availability", async () => {
    const inventory = await createInventory({ productId: "reserve-race", stock: 5, reservedStock: 0 });

    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        reserveInventoryStockService(inventory.productId, { quantity: 1, reason: "checkout" }),
      ),
    );

    const successes = results.filter((result) => result.status === "fulfilled");
    const failures = results.filter((result) => result.status === "rejected");

    expect(successes).toHaveLength(5);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({
      reason: { status: 400, message: "Insufficient stock" },
    });
    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 5,
      reservedStock: 5,
      availableStock: 0,
    });
  });
});

  it("deduplicates repeated reserve operation ids", async () => {
    const inventory = await createInventory({ productId: "reserve-operation-id", stock: 5, reservedStock: 0 });

    await reserveInventoryStockService(inventory.productId, {
      quantity: 2,
      reason: "checkout",
      operationId: "reserve-op-1",
    });
    await reserveInventoryStockService(inventory.productId, {
      quantity: 2,
      reason: "checkout",
      operationId: "reserve-op-1",
    });

    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 5,
      reservedStock: 2,
      availableStock: 3,
    });
  });


describe("releaseInventoryStockService", () => {
  it("partially releases reserved stock", async () => {
    const { releaseInventoryStockService } = await import("./services/inventory.service.js");
    const inventory = await createInventory({ productId: "release-partial", stock: 10, reservedStock: 6 });

    const result = await releaseInventoryStockService(inventory.productId, {
      quantity: 2,
      reason: "order-cancelled",
    });

    expect(result).toMatchObject({ stock: 10, reservedStock: 4, availableStock: 6 });
    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 10,
      reservedStock: 4,
      availableStock: 6,
    });
  });

  it("releases all reserved stock to zero", async () => {
    const { releaseInventoryStockService } = await import("./services/inventory.service.js");
    const inventory = await createInventory({ productId: "release-full", stock: 7, reservedStock: 7 });

    const result = await releaseInventoryStockService(inventory.productId, {
      quantity: 7,
      reason: "order-cancelled",
    });

    expect(result).toMatchObject({ stock: 7, reservedStock: 0, availableStock: 7 });
  });

  it("rejects over-release and leaves state unchanged", async () => {
    const { releaseInventoryStockService } = await import("./services/inventory.service.js");
    const inventory = await createInventory({ productId: "release-over", stock: 9, reservedStock: 3 });

    await expect(
      releaseInventoryStockService(inventory.productId, { quantity: 4, reason: "order-cancelled" }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Reserved stock is insufficient",
      details: { productId: inventory.productId, reservedStock: 3, releaseQuantity: 4 },
    });

    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 9,
      reservedStock: 3,
      availableStock: 6,
    });
  });

  it("returns not found for missing inventory", async () => {
    const { releaseInventoryStockService } = await import("./services/inventory.service.js");

    await expect(
      releaseInventoryStockService("missing-release", { quantity: 1, reason: "order-cancelled" }),
    ).rejects.toMatchObject({ status: 404, message: "Inventory not found" });
  });

  it("rejects invalid release quantities before reaching service mutation", async () => {
    const inventory = await createInventory({ productId: "release-invalid", stock: 5, reservedStock: 2 });

    await request(app)
      .post(`/products/${inventory.productId}/release`)
      .send({ quantity: 0, reason: "order-cancelled" })
      .expect(400);

    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 5,
      reservedStock: 2,
      availableStock: 3,
    });
  });

  it("prevents competing releases from making reserved stock negative", async () => {
    const { releaseInventoryStockService } = await import("./services/inventory.service.js");
    const inventory = await createInventory({ productId: "release-race", stock: 5, reservedStock: 5 });

    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        releaseInventoryStockService(inventory.productId, { quantity: 1, reason: "order-cancelled" }),
      ),
    );

    const successes = results.filter((result) => result.status === "fulfilled");
    const failures = results.filter((result) => result.status === "rejected");

    expect(successes).toHaveLength(5);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({
      reason: { status: 400, message: "Reserved stock is insufficient" },
    });
    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 5,
      reservedStock: 0,
      availableStock: 5,
    });
  });
});

describe("consumeInventoryReservationService", () => {
  it("partially consumes reserved stock and decrements both fields", async () => {
    const { consumeInventoryReservationService } = await import("./services/inventory.service.js");
    const inventory = await createInventory({ productId: "consume-partial", stock: 10, reservedStock: 6 });

    const result = await consumeInventoryReservationService(inventory.productId, {
      quantity: 2,
      reason: "payment-confirmed",
    });

    expect(result).toMatchObject({ stock: 8, reservedStock: 4, availableStock: 4 });
    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 8,
      reservedStock: 4,
      availableStock: 4,
    });
  });

  it("consumes a full reservation", async () => {
    const { consumeInventoryReservationService } = await import("./services/inventory.service.js");
    const inventory = await createInventory({ productId: "consume-full", stock: 7, reservedStock: 7 });

    const result = await consumeInventoryReservationService(inventory.productId, {
      quantity: 7,
      reason: "payment-confirmed",
    });

    expect(result).toMatchObject({ stock: 0, reservedStock: 0, availableStock: 0 });
  });

  it("rejects insufficient reserved stock and leaves both fields unchanged", async () => {
    const { consumeInventoryReservationService } = await import("./services/inventory.service.js");
    const inventory = await createInventory({ productId: "consume-insufficient", stock: 8, reservedStock: 3 });

    await expect(
      consumeInventoryReservationService(inventory.productId, { quantity: 4, reason: "payment-confirmed" }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Reserved stock is insufficient",
      details: { productId: inventory.productId, reservedStock: 3, consumeQuantity: 4 },
    });

    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 8,
      reservedStock: 3,
      availableStock: 5,
    });
  });

  it("returns not found for missing inventory", async () => {
    const { consumeInventoryReservationService } = await import("./services/inventory.service.js");

    await expect(
      consumeInventoryReservationService("missing-consume", { quantity: 1, reason: "payment-confirmed" }),
    ).rejects.toMatchObject({ status: 404, message: "Inventory not found" });
  });

  it("rejects invalid consume quantities before reaching service mutation", async () => {
    const inventory = await createInventory({ productId: "consume-invalid", stock: 5, reservedStock: 2 });

    await request(app)
      .post(`/products/${inventory.productId}/consume`)
      .send({ quantity: 0, reason: "payment-confirmed" })
      .expect(400);

    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 5,
      reservedStock: 2,
      availableStock: 3,
    });
  });

  it("prevents competing consumption from consuming the same reservation twice", async () => {
    const { consumeInventoryReservationService } = await import("./services/inventory.service.js");
    const inventory = await createInventory({ productId: "consume-race", stock: 5, reservedStock: 5 });

    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        consumeInventoryReservationService(inventory.productId, { quantity: 1, reason: "payment-confirmed" }),
      ),
    );

    const successes = results.filter((result) => result.status === "fulfilled");
    const failures = results.filter((result) => result.status === "rejected");

    expect(successes).toHaveLength(5);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({
      reason: { status: 400, message: "Reserved stock is insufficient" },
    });
    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 0,
      reservedStock: 0,
      availableStock: 0,
    });
  });
});

describe("consume inventory operation idempotency", () => {
  it("deduplicates repeated consume operation ids", async () => {
    const { consumeInventoryReservationService } = await import("./services/inventory.service.js");
    const inventory = await createInventory({ productId: "consume-operation-id", stock: 10, reservedStock: 3 });

    await consumeInventoryReservationService(inventory.productId, {
      quantity: 3,
      reason: "payment-confirmed",
      operationId: "order-1:consume:consume-operation-id",
    });
    await consumeInventoryReservationService(inventory.productId, {
      quantity: 3,
      reason: "payment-confirmed",
      operationId: "order-1:consume:consume-operation-id",
    });

    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 7,
      reservedStock: 0,
      availableStock: 7,
    });
  });

  it("rejects consume operation id reuse with different input", async () => {
    const { consumeInventoryReservationService } = await import("./services/inventory.service.js");
    const inventory = await createInventory({ productId: "consume-operation-conflict", stock: 10, reservedStock: 5 });

    await consumeInventoryReservationService(inventory.productId, {
      quantity: 2,
      reason: "payment-confirmed",
      operationId: "order-1:consume:conflict",
    });

    await expect(
      consumeInventoryReservationService(inventory.productId, {
        quantity: 3,
        reason: "payment-confirmed",
        operationId: "order-1:consume:conflict",
      }),
    ).rejects.toMatchObject({ status: 409, message: "Inventory operation id was reused with different input" });

    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 8,
      reservedStock: 3,
      availableStock: 5,
    });
  });
});
describe("inventory mutation concurrency", () => {
  function countResults<T>(results: PromiseSettledResult<T>[]) {
    const successes = results.filter((result) => result.status === "fulfilled");
    const failures = results.filter((result) => result.status === "rejected");
    return { successes, failures };
  }

  async function expectInvariant(productId: string) {
    const state = await getInventory(productId);
    expect(state.stock).toBeGreaterThanOrEqual(0);
    expect(state.reservedStock).toBeGreaterThanOrEqual(0);
    expect(state.reservedStock).toBeLessThanOrEqual(state.stock);
    expect(state.availableStock).toBe(state.stock - state.reservedStock);
    return state;
  }

  it("prevents reservation contention from exceeding available stock", async () => {
    const inventory = await createInventory({ productId: "concurrent-reserve", stock: 9, reservedStock: 2 });

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        reserveInventoryStockService(inventory.productId, { quantity: 1, reason: "concurrency-test" }),
      ),
    );
    const { successes, failures } = countResults(results);
    const state = await expectInvariant(inventory.productId);

    expect(successes).toHaveLength(7);
    expect(failures).toHaveLength(3);
    for (const failure of failures) {
      expect(failure).toMatchObject({ reason: { status: 400, message: "Insufficient stock" } });
    }
    expect(state).toEqual({ stock: 9, reservedStock: 9, availableStock: 0 });
    expect(state.reservedStock - 2).toBe(successes.length);
  });

  it("prevents release contention from releasing more than reserved stock", async () => {
    const { releaseInventoryStockService } = await import("./services/inventory.service.js");
    const inventory = await createInventory({ productId: "concurrent-release", stock: 9, reservedStock: 7 });

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        releaseInventoryStockService(inventory.productId, { quantity: 1, reason: "concurrency-test" }),
      ),
    );
    const { successes, failures } = countResults(results);
    const state = await expectInvariant(inventory.productId);

    expect(successes).toHaveLength(7);
    expect(failures).toHaveLength(3);
    for (const failure of failures) {
      expect(failure).toMatchObject({ reason: { status: 400, message: "Reserved stock is insufficient" } });
    }
    expect(state).toEqual({ stock: 9, reservedStock: 0, availableStock: 9 });
    expect(7 - state.reservedStock).toBe(successes.length);
  });

  it("prevents consumption contention from consuming the same reservation twice", async () => {
    const { consumeInventoryReservationService } = await import("./services/inventory.service.js");
    const inventory = await createInventory({ productId: "concurrent-consume", stock: 9, reservedStock: 7 });

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, () =>
        consumeInventoryReservationService(inventory.productId, { quantity: 1, reason: "concurrency-test" }),
      ),
    );
    const { successes, failures } = countResults(results);
    const state = await expectInvariant(inventory.productId);

    expect(successes).toHaveLength(7);
    expect(failures).toHaveLength(3);
    for (const failure of failures) {
      expect(failure).toMatchObject({ reason: { status: 400, message: "Reserved stock is insufficient" } });
    }
    expect(state).toEqual({ stock: 2, reservedStock: 0, availableStock: 2 });
    expect(9 - state.stock).toBe(successes.length);
  });

  it("preserves invariants across mixed concurrent mutations", async () => {
    const { consumeInventoryReservationService, releaseInventoryStockService } = await import("./services/inventory.service.js");
    const inventory = await createInventory({ productId: "concurrent-mixed", stock: 12, reservedStock: 4 });

    const results = await Promise.allSettled([
      reserveInventoryStockService(inventory.productId, { quantity: 3, reason: "mixed-test" }),
      reserveInventoryStockService(inventory.productId, { quantity: 3, reason: "mixed-test" }),
      releaseInventoryStockService(inventory.productId, { quantity: 2, reason: "mixed-test" }),
      consumeInventoryReservationService(inventory.productId, { quantity: 2, reason: "mixed-test" }),
      consumeInventoryReservationService(inventory.productId, { quantity: 2, reason: "mixed-test" }),
    ]);

    const { successes } = countResults(results);
    const state = await expectInvariant(inventory.productId);

    expect(successes.length).toBeGreaterThanOrEqual(4);
    expect(state.reservedStock).toBeLessThanOrEqual(state.stock);
  });
});


