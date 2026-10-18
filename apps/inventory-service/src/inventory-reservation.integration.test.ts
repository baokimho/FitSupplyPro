import express from "express";
import { randomUUID } from "node:crypto";
import { createIntegrationEvent, checkoutMessageHandler, serializeIntegrationEvent, createLogger, processCheckoutEvent } from "@shared/utils";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
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
    const publish = async () => { if (++publications === 1) throw new Error("publish unavailable after commit"); };
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


