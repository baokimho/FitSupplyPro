import { createHash, randomUUID } from "node:crypto";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from "@shared/utils";
import { Prisma } from "../generated/prisma/index.js";
import type { PaymentStatus } from "../generated/prisma/index.js";
import prisma from "../config/db.js";
import type { CreatePaymentInput } from "../validations/payment.schema.js";

type OrderResponse = {
  id: string;
  userId: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  totalAmount: number | string;
};

type PaymentWithScalars = Prisma.PaymentGetPayload<Record<string, never>>;
type PaymentResponse = ReturnType<typeof toPaymentResponse>;
type IdempotencyRow = {
  id: string;
  requestFingerprint: string;
  status: string;
  paymentId: string | null;
  responseBody: Prisma.JsonValue | null;
};

const orderServiceUrl = process.env.ORDER_SERVICE_URL || "http://order-service:3003";
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3008";
const internalSecret = process.env.GATEWAY_SECRET || "";
const paymentCurrency = "USD";
const maxMoney = new Prisma.Decimal("99999999.99");

const jsonHeaders = {
  "content-type": "application/json",
  "x-internal-secret": internalSecret,
};

const toMoney = (value: Prisma.Decimal | string | number, field: string) => {
  try {
    const decimal = new Prisma.Decimal(String(value));
    if (!decimal.isFinite() || decimal.isNegative() || decimal.decimalPlaces() > 2 || decimal.greaterThan(maxMoney)) {
      throw new Error("Invalid money");
    }

    return new Prisma.Decimal(decimal.toFixed(2));
  } catch {
    throw new BadRequestError(`${field} is invalid`);
  }
};

const toNumber = (value: Prisma.Decimal | string | number) => Number(value);

const toPaymentResponse = (payment: PaymentWithScalars) => ({
  id: payment.id,
  userId: payment.userId,
  orderId: payment.orderId,
  amount: toNumber(payment.amount),
  currency: payment.currency,
  status: payment.status,
  provider: payment.provider,
  providerPaymentId: payment.providerPaymentId,
  progressState: payment.progressState,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }

  return value;
};

const createRequestFingerprint = (body: CreatePaymentInput) =>
  createHash("sha256").update(JSON.stringify(canonicalize(body))).digest("hex");

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (error) {
    throw new ServiceUnavailableError("Downstream service unavailable", {
      url,
      cause: error instanceof Error ? error.message : "Unknown error",
    });
  }

  const text = await response.text();
  const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  if (!response.ok) {
    if (response.status === 404) {
      throw new NotFoundError(typeof data.message === "string" ? data.message : "Resource not found", data);
    }

    if (response.status === 403) {
      throw new ForbiddenError("Forbidden", data);
    }

    if (response.status >= 500) {
      throw new ServiceUnavailableError("Downstream service unavailable", { url, status: response.status });
    }

    throw new BadRequestError(
      typeof data.message === "string" ? data.message : "Downstream request failed",
      data,
    );
  }

  return data as T;
};

const getOrder = async (orderId: string, userId: string) => {
  try {
    return await fetchJson<OrderResponse>(`${orderServiceUrl}/orders/${orderId}`, {
      headers: {
        ...jsonHeaders,
        "x-user-id": userId,
      },
    });
  } catch (error) {
    if (error instanceof ServiceUnavailableError) {
      throw new ServiceUnavailableError("Order service unavailable");
    }

    throw error;
  }
};

const confirmOrder = async (orderId: string, userId: string) => {
  try {
    await fetchJson(`${orderServiceUrl}/orders/${orderId}/confirm`, {
      method: "PATCH",
      headers: {
        ...jsonHeaders,
        "x-user-id": userId,
      },
    });
  } catch (error) {
    if (error instanceof ServiceUnavailableError) {
      throw new ServiceUnavailableError("Order service unavailable");
    }

    throw error;
  }
};

const cancelOrder = async (orderId: string, userId: string) => {
  try {
    await fetchJson(`${orderServiceUrl}/orders/${orderId}/cancel`, {
      method: "PATCH",
      headers: {
        ...jsonHeaders,
        "x-user-id": userId,
      },
    });
  } catch (error) {
    if (error instanceof BadRequestError && error.message === "Order is already cancelled") {
      return;
    }

    if (error instanceof ServiceUnavailableError) {
      throw new ServiceUnavailableError("Order service unavailable");
    }

    throw error;
  }
};
const createNotification = async (
  userId: string,
  body: { type: "PAYMENT_PAID" | "PAYMENT_FAILED"; title: string; message: string },
) => {
  try {
    await fetchJson(`${notificationServiceUrl}/internal/notifications`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ userId, ...body }),
    });
  } catch (error) {
    console.error("Failed to create payment notification", {
      userId,
      type: body.type,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

const claimPaymentIdempotency = async (
  userId: string,
  idempotencyKey: string,
  requestFingerprint: string,
) => {
  const inserted = await prisma.$queryRaw<IdempotencyRow[]>`
    INSERT INTO "PaymentIdempotency" ("id", "userId", "action", "idempotencyKey", "requestFingerprint", "status", "updatedAt")
    VALUES (${randomUUID()}, ${userId}, 'payment.create', ${idempotencyKey}, ${requestFingerprint}, 'PROCESSING', NOW())
    ON CONFLICT ("userId", "action", "idempotencyKey") DO NOTHING
    RETURNING "id", "requestFingerprint", "status", "paymentId", "responseBody"
  `;

  if (inserted[0]) {
    return { row: inserted[0], owner: true };
  }

  const existing = await prisma.$queryRaw<IdempotencyRow[]>`
    SELECT "id", "requestFingerprint", "status", "paymentId", "responseBody"
    FROM "PaymentIdempotency"
    WHERE "userId" = ${userId} AND "action" = 'payment.create' AND "idempotencyKey" = ${idempotencyKey}
  `;

  const row = existing[0];
  if (!row) {
    throw new ServiceUnavailableError("Unable to load payment idempotency state");
  }

  return { row, owner: false };
};

const completePaymentIdempotency = async (id: string, paymentId: string, response: PaymentResponse) => {
  await prisma.$executeRaw`
    UPDATE "PaymentIdempotency"
    SET "status" = 'COMPLETED', "paymentId" = ${paymentId}, "responseBody" = ${JSON.stringify(response)}::jsonb, "updatedAt" = NOW()
    WHERE "id" = ${id}
  `;
};

const failPaymentIdempotency = async (id: string, error: unknown) => {
  await prisma.$executeRaw`
    UPDATE "PaymentIdempotency"
    SET "status" = 'FAILED', "errorMessage" = ${error instanceof Error ? error.message : "Payment creation failed"}, "updatedAt" = NOW()
    WHERE "id" = ${id}
  `;
};

const getPaymentByIdOrThrow = async (id: string) => {
  const payment = await prisma.payment.findUnique({ where: { id } });

  if (!payment) {
    throw new NotFoundError("Payment not found");
  }

  return payment;
};

const ensureOwnership = (payment: PaymentWithScalars, userId: string) => {
  if (payment.userId !== userId) {
    throw new ForbiddenError("Forbidden");
  }
};

const findExistingOrderPayment = async (orderId: string, userId: string) => {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) {
    return null;
  }

  ensureOwnership(payment, userId);
  return payment;
};

export const createPaymentService = async (
  userId: string,
  body: CreatePaymentInput,
  idempotencyKey: string,
) => {
  const requestFingerprint = createRequestFingerprint(body);
  const attempt = await claimPaymentIdempotency(userId, idempotencyKey, requestFingerprint);

  if (attempt.row.requestFingerprint !== requestFingerprint) {
    throw new ConflictError("Idempotency key was reused with a different request");
  }

  if (!attempt.owner) {
    if (attempt.row.status === "COMPLETED" && attempt.row.responseBody) {
      return attempt.row.responseBody as unknown as PaymentResponse;
    }

    if (attempt.row.paymentId) {
      return toPaymentResponse(await getPaymentByIdOrThrow(attempt.row.paymentId));
    }

    const existing = await findExistingOrderPayment(body.orderId, userId);
    if (existing) {
      const response = toPaymentResponse(existing);
      await completePaymentIdempotency(attempt.row.id, existing.id, response);
      return response;
    }

    if (attempt.row.status === "FAILED") {
      throw new ConflictError("Payment creation previously failed");
    }

    throw new ConflictError("Payment creation already in progress");
  }

  try {
    const order = await getOrder(body.orderId, userId);

    if (order.userId !== userId) {
      throw new ForbiddenError("Forbidden");
    }

    if (order.status !== "PENDING") {
      throw new BadRequestError("Order is not payable", { orderId: order.id, status: order.status });
    }

    const amount = toMoney(order.totalAmount, "Order total");
    const payment = await prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findUnique({ where: { orderId: order.id } });
      if (existing) {
        ensureOwnership(existing, userId);
        return existing;
      }

      return tx.payment.create({
        data: {
          userId,
          orderId: order.id,
          amount,
          currency: paymentCurrency,
          progressState: "CREATED",
        },
      });
    });

    const response = toPaymentResponse(payment);
    await completePaymentIdempotency(attempt.row.id, payment.id, response);
    return response;
  } catch (error) {
    await failPaymentIdempotency(attempt.row.id, error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await findExistingOrderPayment(body.orderId, userId);
      if (existing) {
        const response = toPaymentResponse(existing);
        await completePaymentIdempotency(attempt.row.id, existing.id, response);
        return response;
      }

      throw new ConflictError("Payment already exists");
    }

    throw error;
  }
};

export const getMyPaymentsService = async (userId: string) => {
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return payments.map(toPaymentResponse);
};

export const getPaymentByIdService = async (id: string, userId: string) => {
  const payment = await getPaymentByIdOrThrow(id);
  ensureOwnership(payment, userId);
  return toPaymentResponse(payment);
};

const updatePaymentStatus = async (id: string, userId: string, status: PaymentStatus) => {
  const payment = await getPaymentByIdOrThrow(id);
  ensureOwnership(payment, userId);

  if (status === "PAID") {
    if (payment.status === "PAID") {
      return toPaymentResponse(payment);
    }

    if (payment.status === "REFUNDED") {
      throw new BadRequestError("Refunded payment cannot be confirmed");
    }

    if (payment.status !== "PENDING") {
      throw new BadRequestError("Only pending payment can be confirmed");
    }

    await confirmOrder(payment.orderId, userId);
  }

  if (status === "REFUNDED" && payment.status !== "PAID") {
    throw new BadRequestError("Only paid payment can be refunded");
  }

  if (status === "FAILED" || status === "CANCELLED") {
    if (payment.status === status) {
      return toPaymentResponse(payment);
    }

    if (payment.status !== "PENDING") {
      throw new BadRequestError("Only pending payment can be failed or cancelled");
    }

    await cancelOrder(payment.orderId, userId);
  }
  const updated = await prisma.payment.update({ where: { id }, data: { status } });

  if (status === "PAID") {
    await createNotification(userId, {
      type: "PAYMENT_PAID",
      title: "Payment confirmed",
      message: `Payment ${id} has been confirmed.`,
    });
  }

  if (status === "FAILED") {
    await createNotification(userId, {
      type: "PAYMENT_FAILED",
      title: "Payment failed",
      message: `Payment ${id} has failed.`,
    });
  }

  return toPaymentResponse(updated);
};

export const confirmPaymentService = async (id: string, userId: string) =>
  updatePaymentStatus(id, userId, "PAID");

export const failPaymentService = async (id: string, userId: string) =>
  updatePaymentStatus(id, userId, "FAILED");

export const cancelPaymentService = async (id: string, userId: string) =>
  updatePaymentStatus(id, userId, "CANCELLED");

export const refundPaymentService = async (id: string, userId: string) =>
  updatePaymentStatus(id, userId, "REFUNDED");
