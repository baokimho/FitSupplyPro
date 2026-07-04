import {
  BadRequestError,
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

const orderServiceUrl = process.env.ORDER_SERVICE_URL || "http://order-service:3003";
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3008";
const internalSecret = process.env.GATEWAY_SECRET || "";

const jsonHeaders = {
  "content-type": "application/json",
  "x-internal-secret": internalSecret,
};

const toDecimal = (value: number) => new Prisma.Decimal(value.toFixed(2));
const toNumber = (value: Prisma.Decimal | string | number) => Number(value);

const toPaymentResponse = (payment: PaymentWithScalars) => ({
  id: payment.id,
  userId: payment.userId,
  orderId: payment.orderId,
  amount: toNumber(payment.amount),
  status: payment.status,
  provider: payment.provider,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

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
      throw new ServiceUnavailableError("Downstream service unavailable", {
        url,
        status: response.status,
        response: data,
      });
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
      throw new ServiceUnavailableError("Order service unavailable", error.details);
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
      throw new ServiceUnavailableError("Order service unavailable", error.details);
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
      body: JSON.stringify({
        userId,
        ...body,
      }),
    });
  } catch (error) {
    console.error("Failed to create payment notification", {
      userId,
      type: body.type,
      error,
    });
  }
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

export const createPaymentService = async (userId: string, body: CreatePaymentInput) => {
  const order = await getOrder(body.orderId, userId);

  if (order.userId !== userId) {
    throw new ForbiddenError("Forbidden");
  }

  if (order.status !== "PENDING") {
    throw new BadRequestError("Order is not payable", { orderId: order.id, status: order.status });
  }

  const payment = await prisma.payment.create({
    data: {
      userId,
      orderId: order.id,
      amount: toDecimal(Number(order.totalAmount)),
    },
  });

  return toPaymentResponse(payment);
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
      throw new BadRequestError("Payment is already paid");
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

  if ((status === "FAILED" || status === "CANCELLED") && payment.status !== "PENDING") {
    throw new BadRequestError("Only pending payment can be failed or cancelled");
  }

  const updated = await prisma.payment.update({
    where: { id },
    data: { status },
  });

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

export const refundPaymentService = async (id: string, userId: string) =>
  updatePaymentStatus(id, userId, "REFUNDED");
