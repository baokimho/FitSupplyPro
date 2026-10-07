import express from "express";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler, requireTestDatabaseUrl } from "@shared/utils";
import { PrismaClient } from "./generated/prisma/index.js";
import type { confirmPaymentService as confirmPaymentServiceType, createPaymentService as createPaymentServiceType, failPaymentService as failPaymentServiceType, refundPaymentService as refundPaymentServiceType } from "./services/payment.service.js";

let prisma: PrismaClient;
let refundPaymentService: typeof refundPaymentServiceType;
let confirmPaymentService: typeof confirmPaymentServiceType;
let createPaymentService: typeof createPaymentServiceType;
let failPaymentService: typeof failPaymentServiceType;
let app: express.Express;

const databaseUrl = requireTestDatabaseUrl("payment_test_db");
const originalFetch = globalThis.fetch;

const orderId = "11111111-1111-4111-8111-111111111111";
const secondOrderId = "22222222-2222-4222-8222-222222222222";
let secondOrderOwner = "user-1";
let orderDelayMs = 0;
let orderFetchCount = 0;
let orderCancelCalls = 0;
let orderConfirmCalls = 0;
let failOrderCancel = false;
let failOrderConfirm = false;
let orderStatus: "PENDING" | "CONFIRMED" | "CANCELLED" = "PENDING";

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

async function truncatePaymentDb() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "PaymentIdempotency", "Payment" RESTART IDENTITY CASCADE;');
}

async function countPayments() {
  return prisma.payment.count();
}

function installFetchDouble() {
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => {
    const url = String(input);

    if (url.includes("/orders/") && !url.includes("/confirm") && !url.includes("/cancel")) {
      orderFetchCount += 1;
      if (orderDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, orderDelayMs));
      }

      const id = url.includes(secondOrderId) ? secondOrderId : orderId;
      return jsonResponse({
        id,
        userId: id === secondOrderId ? secondOrderOwner : "user-1",
        status: orderStatus,
        totalAmount: id === secondOrderId ? "25.50" : "19.99",
        currency: "USD",
      });
    }

    if (url.includes("/confirm")) {
      orderConfirmCalls += 1;
      if (failOrderConfirm) {
        return jsonResponse({ error: { code: "INTERNAL_ERROR", message: "consume failed" } }, 500);
      }
      return jsonResponse({});
    }

    if (url.includes("/cancel")) {
      orderCancelCalls += 1;
      if (failOrderCancel) {
        return jsonResponse({ error: { code: "INTERNAL_ERROR", message: "release failed" } }, 500);
      }
      return jsonResponse({});
    }

    if (url.includes("/internal/notifications")) {
      return jsonResponse({});
    }
    return jsonResponse({ error: { code: "INTERNAL_ERROR", message: `Unhandled request: ${url}` } }, 500);
  }));
}

beforeAll(async () => {
  process.env.DATABASE_URL = databaseUrl;
  process.env.GATEWAY_SECRET = "fitsupply_test_internal_secret";
  process.env.ORDER_SERVICE_URL = "http://order-service.test";
  process.env.NOTIFICATION_SERVICE_URL = "http://notification-service.test";

  installFetchDouble();
  const dbModule = await import("./config/db.js");
  prisma = dbModule.default;
  ({ refundPaymentService, confirmPaymentService, createPaymentService, failPaymentService } = await import("./services/payment.service.js"));

  const routes = (await import("./routes/payment.route.js")).default;
  app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.paymentUser = { id: "user-1", role: "CUSTOMER" };
    next();
  });
  app.use(routes);
  app.use(errorHandler);
});

beforeEach(async () => {
  await truncatePaymentDb();
  orderDelayMs = 0;
  orderFetchCount = 0;
  orderCancelCalls = 0;
  orderConfirmCalls = 0;
  failOrderCancel = false;
  failOrderConfirm = false;
  orderStatus = "PENDING";
  secondOrderOwner = "user-1";
  installFetchDouble();
});

describe("payment idempotency", () => {
  it("rejects missing Orders and another customer's Order", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: { code: "NOT_FOUND", message: "Order not found" } }, 404)));
    await expect(createPaymentService("user-1", { orderId }, "missing")).rejects.toMatchObject({ status: 404 });
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ id: orderId, userId: "user-2", status: "PENDING", totalAmount: "19.99", currency: "USD" })));
    await expect(createPaymentService("user-1", { orderId }, "wrong-owner")).rejects.toMatchObject({ status: 403 });
    expect(await countPayments()).toBe(0);
  });

  it("rejects Orders with an unfinished cancellation command", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ id: orderId, userId: "user-1", status: "PENDING", pendingStatus: "CANCELLED", totalAmount: "19.99", currency: "USD" })));
    await expect(createPaymentService("user-1", { orderId }, "pending-cancel")).rejects.toMatchObject({ status: 400 });
    expect(await countPayments()).toBe(0);
  });

  it.each(["-0.01", "0.001", "100000000.00", "NaN"])("rejects invalid authoritative money %s", async (totalAmount) => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ id: orderId, userId: "user-1", status: "PENDING", totalAmount, currency: "USD" })));
    await expect(createPaymentService("user-1", { orderId }, "bad-money")).rejects.toMatchObject({ status: 400 });
    expect(await countPayments()).toBe(0);
  });

  it("creates a payment on first successful request", async () => {
    const payment = await createPaymentService("user-1", { orderId }, "payment-key-1");

    expect(payment).toMatchObject({
      userId: "user-1",
      orderId,
      amount: "19.99",
      currency: "USD",
      status: "PENDING",
      progressState: "CREATED",
    });
    expect(await countPayments()).toBe(1);
  });

  it("replays a completed request without calling downstream order service", async () => {
    const first = await createPaymentService("user-1", { orderId }, "payment-key-replay");
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: { code: "INTERNAL_ERROR", message: "should not call downstream" } }, 500)));

    const second = await createPaymentService("user-1", { orderId }, "payment-key-replay");

    expect(second).toMatchObject({ id: first.id, orderId: first.orderId, amount: first.amount });
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(await countPayments()).toBe(1);
  });

  it("replays durable state written through a separate database connection", async () => {
    const first = await createPaymentService("user-1", { orderId }, "payment-key-separate-db");
    const separatePool = new pg.Pool({ connectionString: databaseUrl });
    const separatePrisma = new PrismaClient({ adapter: new PrismaPg(separatePool) });
    try {
      await separatePrisma.paymentIdempotency.update({
        where: {
          userId_action_idempotencyKey: {
            userId: "user-1",
            action: "payment.create",
            idempotencyKey: "payment-key-separate-db",
          },
        },
        data: { responseBody: undefined },
      });
    } finally {
      await separatePrisma.$disconnect();
      await separatePool.end();
    }
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: { code: "INTERNAL_ERROR", message: "should not call downstream" } }, 500)));

    const second = await createPaymentService("user-1", { orderId }, "payment-key-separate-db");

    expect(second).toMatchObject({ id: first.id, orderId });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("recovers an interrupted completed payment from durable order uniqueness", async () => {
    const first = await createPaymentService("user-1", { orderId }, "payment-key-interrupted");
    await prisma.paymentIdempotency.update({
      where: {
        userId_action_idempotencyKey: {
          userId: "user-1",
          action: "payment.create",
          idempotencyKey: "payment-key-interrupted",
        },
      },
      data: { status: "FAILED", paymentId: null, responseBody: undefined },
    });
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: { code: "INTERNAL_ERROR", message: "should not call downstream" } }, 500)));

    const second = await createPaymentService("user-1", { orderId }, "payment-key-interrupted");

    expect(second).toMatchObject({ id: first.id, orderId });
    expect(globalThis.fetch).not.toHaveBeenCalled();
    const attempt = await prisma.paymentIdempotency.findUniqueOrThrow({
      where: {
        userId_action_idempotencyKey: {
          userId: "user-1",
          action: "payment.create",
          idempotencyKey: "payment-key-interrupted",
        },
      },
    });
    expect(attempt).toMatchObject({ status: "COMPLETED", paymentId: first.id });
  });

  it("rejects same key with different request body", async () => {
    await createPaymentService("user-1", { orderId }, "payment-key-conflict");

    await expect(
      createPaymentService("user-1", { orderId: secondOrderId }, "payment-key-conflict"),
    ).rejects.toMatchObject({ status: 409, message: "Idempotency key was reused with a different request" });
  });

  it("scopes the same idempotency key independently per user", async () => {
    secondOrderOwner = "user-2";
    await createPaymentService("user-1", { orderId }, "shared-payment-key");
    await createPaymentService("user-2", { orderId: secondOrderId }, "shared-payment-key");

    expect(await countPayments()).toBe(2);
  });

  it("returns the existing logical payment when different keys target one order", async () => {
    const first = await createPaymentService("user-1", { orderId }, "payment-key-order-a");
    const second = await createPaymentService("user-1", { orderId }, "payment-key-order-b");

    expect(second).toMatchObject({ id: first.id, orderId });
    expect(await countPayments()).toBe(1);
  });

  it("executes concurrent duplicate payment creation only once", async () => {
    orderDelayMs = 50;

    const results = await Promise.allSettled([
      createPaymentService("user-1", { orderId }, "payment-key-race"),
      createPaymentService("user-1", { orderId }, "payment-key-race"),
    ]);

    expect(await countPayments()).toBe(1);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(2);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(0);
    expect(orderFetchCount).toBe(1);
  });

  it("validates missing, blank, malformed, and overlong idempotency keys", async () => {
    await request(app)
      .post("/payments")
      .send({ orderId })
      .expect(400);

    await request(app)
      .post("/payments")
      .set("Idempotency-Key", "   ")
      .send({ orderId })
      .expect(400);

    await request(app)
      .post("/payments")
      .set("Idempotency-Key", "bad key")
      .send({ orderId })
      .expect(400);

    await request(app)
      .post("/payments")
      .set("Idempotency-Key", "a".repeat(129))
      .send({ orderId })
      .expect(400);

    expect(await countPayments()).toBe(0);
    expect(orderFetchCount).toBe(0);
  });

  it("rejects invalid order ids and unexpected client-controlled fields before side effects", async () => {
    await request(app)
      .post("/payments")
      .set("Idempotency-Key", "payment-key-invalid-order")
      .send({ orderId: "not-a-uuid" })
      .expect(400);

    await request(app)
      .post("/payments")
      .set("Idempotency-Key", "payment-key-client-fields")
      .send({
        orderId,
        amount: "0.01",
        currency: "EUR",
        userId: "attacker",
        status: "PAID",
        providerPaymentId: "provider-controlled",
      })
      .expect(400);

    expect(await countPayments()).toBe(0);
    expect(orderFetchCount).toBe(0);
  });

  it("keeps existing payment-service error conventions", async () => {
    orderStatus = "CONFIRMED";

    await expect(
      createPaymentService("user-1", { orderId }, "payment-key-not-payable"),
    ).rejects.toMatchObject({ status: 400, message: "Order is not payable" });

    expect(await countPayments()).toBe(0);
  });

  it("retains successful payment when Order confirmation fails, then retries without charging", async () => {
    const payment = await prisma.payment.create({
      data: { userId: "user-1", orderId, amount: "19.99" },
    });
    failOrderConfirm = true;

    await expect(confirmPaymentService(payment.id, "user-1", "ADMIN"))
      .rejects.toMatchObject({ status: 503, message: "Order service unavailable" });

    await expect(prisma.payment.findUniqueOrThrow({ where: { id: payment.id } }))
      .resolves.toMatchObject({ status: "SUCCEEDED", progressState: "ORDER_CONFIRMATION_PENDING", orderConfirmedAt: null });
    expect(orderConfirmCalls).toBe(1);
    failOrderConfirm = false;
    expect(await confirmPaymentService(payment.id, "user-1", "ADMIN")).toMatchObject({ status: "SUCCEEDED", progressState: "ORDER_CONFIRMED" });
    expect(await prisma.fakeProviderOperation.count({ where: { idempotencyKey: `${payment.id}:settle` } })).toBe(1);
  });

  it("acknowledges payment success and confirms Order once across repeated commands", async () => {
    const payment = await prisma.payment.create({
      data: { userId: "user-1", orderId, amount: "19.99" },
    });

    const paid = await confirmPaymentService(payment.id, "user-1", "ADMIN");

    expect(paid.status).toBe("SUCCEEDED");
    expect(orderConfirmCalls).toBe(1);
    expect(paid.providerPaymentId).toBe(`fake_payment_${payment.id}`);
    await confirmPaymentService(payment.id, "user-1", "ADMIN");
    expect(orderConfirmCalls).toBe(1);
  });

  it("failed provider result leaves Order pending and never confirms or cancels it", async () => {
    const payment = await prisma.payment.create({
      data: { userId: "user-1", orderId, amount: "19.99" },
    });

    const failed = await failPaymentService(payment.id, "user-1", "ADMIN");

    expect(failed.status).toBe("FAILED");
    expect(failed.failureCode).toBe("FAKE_DECLINED");
    expect(orderCancelCalls).toBe(0);
    expect(orderConfirmCalls).toBe(0);
  });

  it("failure is independent of Order availability and duplicate failure is harmless", async () => {
    const payment = await prisma.payment.create({
      data: { userId: "user-1", orderId, amount: "19.99" },
    });
    failOrderCancel = true;

    await failPaymentService(payment.id, "user-1", "ADMIN");
    await failPaymentService(payment.id, "user-1", "ADMIN");

    await expect(prisma.payment.findUniqueOrThrow({ where: { id: payment.id } }))
      .resolves.toMatchObject({ status: "FAILED" });
    expect(orderCancelCalls).toBe(0);
    expect(orderConfirmCalls).toBe(0);
  });

  it("failed attempt stays terminal; fresh key creates new attempt", async () => {
    const failedPayment = await prisma.payment.create({
      data: { userId: "user-1", orderId, amount: "19.99" },
    });
    await failPaymentService(failedPayment.id, "user-1", "ADMIN");
    await expect(confirmPaymentService(failedPayment.id, "user-1", "ADMIN")).rejects.toMatchObject({ status: 409 });
    const retry = await createPaymentService("user-1", { orderId }, "new-attempt");
    expect(retry.id).not.toBe(failedPayment.id);
    expect(retry.status).toBe("PENDING");
    expect(await countPayments()).toBe(2);
    await expect(prisma.payment.findUniqueOrThrow({ where: { id: failedPayment.id } })).resolves.toMatchObject({ status: "FAILED" });
  });

  it("only acknowledged success can be refunded, and repeated refund does not duplicate effects", async () => {
    const payment = await createPaymentService("user-1", { orderId }, "refund-test");
    await expect(refundPaymentService(payment.id, "user-1", "ADMIN")).rejects.toMatchObject({ status: 409 });
    await confirmPaymentService(payment.id, "user-1", "ADMIN");
    await expect(failPaymentService(payment.id, "user-1", "ADMIN")).rejects.toMatchObject({ status: 409 });
    expect(await refundPaymentService(payment.id, "user-1", "ADMIN")).toMatchObject({ status: "REFUNDED" });
    expect(await refundPaymentService(payment.id, "user-1", "ADMIN")).toMatchObject({ status: "REFUNDED" });
    expect(await prisma.fakeProviderOperation.count({ where: { idempotencyKey: `${payment.id}:refund` } })).toBe(1);
    expect(orderConfirmCalls).toBe(1);
    await expect(confirmPaymentService(payment.id, "user-1", "ADMIN")).rejects.toMatchObject({ status: 409 });
  });

  it("rejects first confirmation after Order cancellation without creating provider effect", async () => {
    const payment = await createPaymentService("user-1", { orderId }, "cancel-before-confirm");
    orderStatus = "CANCELLED";
    await expect(confirmPaymentService(payment.id, "user-1", "ADMIN")).rejects.toMatchObject({ status: 409 });
    expect(await prisma.fakeProviderOperation.count({ where: { idempotencyKey: `${payment.id}:settle` } })).toBe(0);
    await expect(prisma.payment.findUniqueOrThrow({ where: { id: payment.id } })).resolves.toMatchObject({ status: "PENDING", pendingOperation: null });
  });

  it("allows refund recovery after successful payment with unresolved Order confirmation", async () => {
    const payment = await createPaymentService("user-1", { orderId }, "unresolved-order-refund");
    failOrderConfirm = true;
    await expect(confirmPaymentService(payment.id, "user-1", "ADMIN")).rejects.toMatchObject({ status: 503 });
    expect(await refundPaymentService(payment.id, "user-1", "ADMIN")).toMatchObject({ status: "REFUNDED", orderConfirmedAt: null });
    expect(orderConfirmCalls).toBe(1);
    expect(orderCancelCalls).toBe(0);
  });

  it("service rejects customer simulation and refund commands before side effects", async () => {
    const payment = await createPaymentService("user-1", { orderId }, "customer-command");
    for (const command of [confirmPaymentService, failPaymentService, refundPaymentService]) {
      await expect(command(payment.id, "user-1", "CUSTOMER")).rejects.toMatchObject({ status: 403 });
    }
    await request(app).patch(`/payments/${payment.id}/confirm`).expect(403);
    await request(app).patch(`/payments/${payment.id}/fail`).expect(403);
    await request(app).patch(`/payments/${payment.id}/refund`).expect(403);
    expect(orderConfirmCalls).toBe(0);
  });
  it("rejects direct database writes that violate uniqueness and monetary constraints", async () => {
    await expect(
      prisma.$executeRaw`INSERT INTO "Payment" ("id", "userId", "orderId", "amount", "status", "provider", "createdAt", "updatedAt") VALUES (${"bad-payment"}, ${"user-1"}, ${""}, ${-1}, ${"PENDING"}, ${"MOCK"}, NOW(), NOW())`,
    ).rejects.toThrow();

    await prisma.payment.create({
      data: {
        id: "constraint-payment",
        userId: "user-1",
        orderId,
        amount: "1.00",
        providerPaymentId: "provider-payment-1",
      },
    });

    await expect(
      prisma.payment.create({
        data: {
          id: "duplicate-order-payment",
          userId: "user-1",
          orderId,
          amount: "2.00",
        },
      }),
    ).rejects.toThrow();

    await expect(
      prisma.payment.create({
        data: {
          id: "duplicate-provider-payment",
          userId: "user-1",
          orderId: secondOrderId,
          amount: "2.00",
          providerPaymentId: "provider-payment-1",
        },
      }),
    ).rejects.toThrow();
  });
});

afterAll(() => {
  vi.stubGlobal("fetch", originalFetch);
});
