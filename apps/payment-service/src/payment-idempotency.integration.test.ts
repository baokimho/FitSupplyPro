import express from "express";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler, requireTestDatabaseUrl } from "@shared/utils";
import { PrismaClient } from "./generated/prisma/index.js";
import type { createPaymentService as createPaymentServiceType } from "./services/payment.service.js";

let prisma: PrismaClient;
let createPaymentService: typeof createPaymentServiceType;
let app: express.Express;

const databaseUrl = requireTestDatabaseUrl("payment_test_db");
const originalFetch = globalThis.fetch;

const orderId = "11111111-1111-4111-8111-111111111111";
const secondOrderId = "22222222-2222-4222-8222-222222222222";
let orderDelayMs = 0;
let orderFetchCount = 0;
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
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = String(input);

    if (url.includes("/orders/") && !url.includes("/confirm")) {
      orderFetchCount += 1;
      if (orderDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, orderDelayMs));
      }

      const id = url.endsWith(secondOrderId) ? secondOrderId : orderId;
      const headers = new Headers(init?.headers);
      return jsonResponse({
        id,
        userId: headers.get("x-user-id") ?? "user-1",
        status: orderStatus,
        totalAmount: id === secondOrderId ? "25.50" : "19.99",
      });
    }

    if (url.includes("/internal/notifications") || url.includes("/confirm")) {
      return jsonResponse({});
    }

    return jsonResponse({ message: `Unhandled request: ${url}` }, 500);
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
  ({ createPaymentService } = await import("./services/payment.service.js"));

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
  orderStatus = "PENDING";
  installFetchDouble();
});

describe("payment idempotency", () => {
  it("creates a payment on first successful request", async () => {
    const payment = await createPaymentService("user-1", { orderId }, "payment-key-1");

    expect(payment).toMatchObject({
      userId: "user-1",
      orderId,
      amount: 19.99,
      currency: "USD",
      status: "PENDING",
      progressState: "CREATED",
    });
    expect(await countPayments()).toBe(1);
  });

  it("replays a completed request without calling downstream order service", async () => {
    const first = await createPaymentService("user-1", { orderId }, "payment-key-replay");
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "should not call downstream" }, 500)));

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
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "should not call downstream" }, 500)));

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
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "should not call downstream" }, 500)));

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
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
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