import { createHash } from "node:crypto";
import { z } from "zod";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, ServiceUnavailableError, correlationHeaders } from "@shared/utils";
import { createIntegrationEvent, deserializeIntegrationEvent, enqueueOutboxEvent, processCheckoutEvent, fetchDependency, withDependencyTimeout, classifyFailure, type KnownIntegrationEvent } from "@shared/utils";
import { Prisma, type PrismaClient, type Payment } from "../generated/prisma/index.js";
import prisma from "../config/db.js";
import { config } from "../config/index.js";
import { logger } from "../logger.js";
import { assertPaymentTransition, type PaymentState } from "../domain/payment-lifecycle.js";
import { paymentProvider } from "../providers/index.js";
import type { PaymentProvider } from "../providers/payment-provider.js";
import type { CreatePaymentInput } from "../validations/payment.schema.js";

const orderSnapshotSchema = z.object({
  id: z.string(), userId: z.string(),
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  pendingStatus: z.string().nullable().optional(), totalAmount: z.string(), currency: z.literal("USD"),
  eventDriven: z.boolean().optional(), items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).optional(),
});

const toPaymentResponse = (payment: Payment) => ({
  id: payment.id, userId: payment.userId, orderId: payment.orderId,
  amount: payment.amount.toFixed(2), currency: payment.currency, status: payment.status,
  provider: payment.provider, providerPaymentId: payment.providerPaymentId,
  progressState: payment.progressState, failureCode: payment.failureCode,
  pendingOperation: payment.pendingOperation,
  orderConfirmedAt: payment.orderConfirmedAt, createdAt: payment.createdAt, updatedAt: payment.updatedAt,
});
type PaymentResponse = ReturnType<typeof toPaymentResponse>;

const fetchOrderJson = async (path: string, method = "GET"): Promise<unknown> => {
  const url = `${config.orderServiceUrl}${path}`;
  let response: Response;
  let data: unknown;
  try {
    const result = await fetchDependency(url, {
      method,
      headers: { "content-type": "application/json", "x-internal-secret": config.gatewaySecret, ...correlationHeaders() },
    }, { dependency: "order-service", operation: method === "GET" ? "payment-snapshot" : "confirm",
      timeoutMs: config.resilience.timeoutMs, safe: true, logger });
    response = result.response;
    const text = result.text;
    try { data = text ? JSON.parse(text) : {}; }
    catch { data = {}; }
  } catch (error) {
    if (classifyFailure(error) === "cancelled") throw error;
    throw new ServiceUnavailableError("Order service unavailable", undefined, undefined, error);
  }
  if (!response.ok) {
    const envelope = z.object({ error: z.object({ message: z.string().optional(), code: z.string().optional(), details: z.unknown().optional() }) }).safeParse(data);
    const error = envelope.success ? envelope.data.error : {};
    if (response.status === 404) throw new NotFoundError(error.message ?? "Resource not found", error.details, error.code);
    if (response.status === 403) throw new ForbiddenError("Forbidden", error.details, error.code);
    if (response.status === 409) throw new ConflictError(error.message ?? "Order command conflict", error.details, error.code);
    if (response.status >= 500) throw new ServiceUnavailableError("Order service unavailable", { status: response.status });
    throw new BadRequestError(error.message ?? "Downstream request failed", error.details, error.code);
  }
  return data;
};

const getOrder = async (orderId: string) => {
  const result = orderSnapshotSchema.safeParse(await fetchOrderJson(`/internal/orders/${orderId}/payment-snapshot`));
  if (!result.success || result.data.id !== orderId) throw new ServiceUnavailableError("Invalid Order payment snapshot");
  return result.data;
};

const toMoney = (value: string) => {
  try {
    const amount = new Prisma.Decimal(value);
    if (!amount.isFinite() || amount.isNegative() || amount.decimalPlaces() > 2 || amount.greaterThan("99999999.99")) throw new Error("Invalid money");
    return amount;
  } catch {
    throw new BadRequestError("Order total is invalid");
  }
};

const getPayment = async (database: Prisma.TransactionClient, id: string) => {
  const payment = await database.payment.findUnique({ where: { id } });
  if (!payment) throw new NotFoundError("Payment not found");
  return payment;
};

const ensureOwnership = (payment: Payment, userId: string) => {
  if (payment.userId !== userId) throw new ForbiddenError("Forbidden");
};

const transactionOptions = { maxWait: 5000, timeout: 15000 };

export function buildPaymentService(database: PrismaClient, provider: PaymentProvider) {
  const create = async (userId: string, body: CreatePaymentInput, idempotencyKey: string, checkout = false) => {
    const requestFingerprint = createHash("sha256").update(JSON.stringify({ orderId: body.orderId })).digest("hex");
    return database.$transaction(async (tx) => {
      // Transaction-scoped PostgreSQL locks work across instances and release on crash.
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`payment.create:${userId}:${idempotencyKey}`}, 0))`;
      const key = { userId, action: "payment.create", idempotencyKey };
      const attempt = await tx.paymentIdempotency.findUnique({ where: { userId_action_idempotencyKey: key } });
      if (attempt && attempt.requestFingerprint !== requestFingerprint) throw new ConflictError("Idempotency key was reused with a different request");
      if (attempt?.status === "COMPLETED" && attempt.responseBody) return attempt.responseBody as unknown as PaymentResponse;
      if (attempt?.paymentId) return toPaymentResponse(await getPayment(tx, attempt.paymentId));

      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`payment.order:${body.orderId}`}, 0))`;
      let existing = await tx.payment.findFirst({ where: { orderId: body.orderId, status: { not: "FAILED" } } });
      if (existing) ensureOwnership(existing, userId);
      // Recover legacy interrupted creates without asking Order again.
      if (!existing || !attempt) {
        const order = await getOrder(body.orderId);
        if (order.eventDriven && !checkout) throw new ConflictError("Event-driven checkout payment is managed internally");
        if (order.userId !== userId) throw new ForbiddenError("Forbidden");
        if (order.status !== "PENDING" || order.pendingStatus) throw new BadRequestError("Order is not payable", { orderId: order.id, status: order.status });
        const amount = toMoney(order.totalAmount);
        if (existing && (!existing.amount.equals(amount) || existing.currency !== order.currency)) throw new ConflictError("Order monetary data differs from payment");
        if (!existing) {
          existing = await tx.payment.create({ data: { userId, orderId: order.id, amount, currency: order.currency } });
        }
      }
      if (!existing) throw new ServiceUnavailableError("Payment creation unavailable");
      const response = toPaymentResponse(existing);
      await tx.paymentIdempotency.upsert({
        where: { userId_action_idempotencyKey: key },
        create: { ...key, requestFingerprint, status: "COMPLETED", paymentId: existing.id, responseBody: JSON.parse(JSON.stringify(response)) },
        update: { status: "COMPLETED", paymentId: existing.id, responseBody: JSON.parse(JSON.stringify(response)), errorMessage: null },
      });
      return response;
    }, transactionOptions);
  };

  const synchronizeOrder = async (id: string) => database.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Payment" WHERE "id" = ${id} FOR UPDATE`;
    const payment = await getPayment(tx, id);
    if (payment.orderConfirmedAt) return payment;
    if (payment.status !== "SUCCEEDED") throw new ConflictError("Payment is not successful");
    try {
      await fetchOrderJson(`/internal/orders/${payment.orderId}/confirm`, "PATCH");
    } catch (error) {
      // A lost confirmation response may be followed by Order advancing further.
      try {
        const order = await getOrder(payment.orderId);
        if (order.userId !== payment.userId || !["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status)) throw error;
      } catch (secondary) {
        logger.error({ paymentId: id, orderId: payment.orderId, err: error, reconciliationError: secondary }, "payment succeeded; retry Order confirmation");
        throw error;
      }
    }
    return tx.payment.update({ where: { id }, data: { orderConfirmedAt: new Date(), progressState: "ORDER_CONFIRMED" } });
  }, transactionOptions);

  const command = async (id: string, userId: string, target: Exclude<PaymentState, "PENDING">, role?: string, synchronize = true, source?: KnownIntegrationEvent, transaction?: Prisma.TransactionClient) => {
    if (role !== "ADMIN") throw new ForbiddenError("Forbidden");
    const initial = await getPayment(database, id);
    assertPaymentTransition(initial.status, target);
    if (initial.status !== target) {
      if (target === "SUCCEEDED" && !initial.pendingOperation) {
        const order = await getOrder(initial.orderId);
        if (order.userId !== initial.userId || order.status !== "PENDING" || order.pendingStatus ||
          !initial.amount.equals(toMoney(order.totalAmount)) || initial.currency !== order.currency) {
          throw new ConflictError("Order is no longer payable");
        }
      }
      // Commit intent before a provider side effect; conflicting commands cannot supersede it.
      await database.payment.updateMany({
        where: { id, status: initial.status, pendingOperation: null }, data: { pendingOperation: target },
      });
    }
    const execute = async (tx: Prisma.TransactionClient) => {
      await tx.$queryRaw`SELECT "id" FROM "Payment" WHERE "id" = ${id} FOR UPDATE`;
      const current = await getPayment(tx, id);
      const finish = async (payment: Payment) => {
        if (source) {
          const metadata = { correlationId: source.correlationId, causationId: source.eventId };
          const data = { orderId: payment.orderId, paymentId: payment.id, amount: payment.amount.toFixed(2), currency: "USD" as const };
          const event = payment.status === "REFUNDED" ? createIntegrationEvent({ eventType: "payment.refunded", ...metadata, data }) :
            payment.status === "SUCCEEDED" ? createIntegrationEvent({ eventType: "payment.succeeded", ...metadata, data }) :
              createIntegrationEvent({ eventType: "payment.failed", ...metadata, data: { ...data, failureCode: payment.failureCode } });
          const stored = await enqueueOutboxEvent(tx, event, `checkout:${source.eventId}`);
          logger.info({ eventId: stored.eventId, eventType: stored.eventType, correlationId: stored.correlationId, paymentId: payment.id }, "outbox intent staged with financial outcome");
        }
        return payment;
      };
      assertPaymentTransition(current.status, target);
      if (current.status === target) return finish(current);
      if (current.pendingOperation !== target) throw new ConflictError("Another payment command requires completion");
      if (current.provider !== provider.name) throw new ConflictError("Payment provider mismatch");
      const input = { paymentId: id, idempotencyKey: `${id}:${target === "REFUNDED" ? "refund" : "settle"}`, amount: current.amount.toFixed(2), currency: current.currency };
      try {
        if (target === "REFUNDED") {
          if (!current.providerPaymentId) throw new ConflictError("Provider payment reference missing");
          await withDependencyTimeout((signal) => provider.refund({ ...input, providerPaymentId: current.providerPaymentId! }, signal), {
            dependency: "payment-provider", operation: "refund", timeoutMs: config.resilience.timeoutMs, safe: true, mutation: true, logger,
          });
          return finish(await tx.payment.update({ where: { id }, data: { status: "REFUNDED", pendingOperation: null, progressState: "REFUNDED" } }));
        }
        // Always persist the acknowledged result, including provider decline of confirmation.
        const result = await withDependencyTimeout((signal) => provider.settle(input, target, signal), {
          dependency: "payment-provider", operation: "settle", timeoutMs: config.resilience.timeoutMs, safe: true, mutation: true, logger,
        });
        assertPaymentTransition(current.status, result.status);
        return finish(await tx.payment.update({ where: { id }, data: {
          status: result.status, providerPaymentId: result.reference, failureCode: result.failureCode ?? null,
          pendingOperation: null, progressState: result.status === "SUCCEEDED" ? "ORDER_CONFIRMATION_PENDING" : "FAILED",
        } }));
      } catch (error) {
        logger.error({ paymentId: id, actorId: userId, operation: target, err: error }, "payment command incomplete; retry same command");
        throw error;
      }
    };
    const payment = transaction ? await execute(transaction) : await database.$transaction(execute, transactionOptions);
    return toPaymentResponse(payment.status === "SUCCEEDED" && synchronize ? await synchronizeOrder(id) : payment);
  };

  return {
    checkout: async (event: KnownIntegrationEvent, outcome: "SUCCEEDED" | "FAILED" = "SUCCEEDED") => {
      if (event.eventType === "checkout.refund_requested") {
        return database.$transaction((tx) => processCheckoutEvent(tx, event, async () => {
          const payment = await getPayment(tx, event.data.paymentId);
          if (payment.orderId !== event.data.orderId) throw new ConflictError("Refund request differs from Payment Order");
          await command(payment.id, payment.userId, "REFUNDED", "ADMIN", false, event, tx);
          const result = await tx.outboxEvent.findUniqueOrThrow({ where: { deduplicationKey: `checkout:${event.eventId}` } });
          return deserializeIntegrationEvent(result.payload);
        }, logger), transactionOptions);
      }
      if (event.eventType !== "inventory.reserved" && event.eventType !== "checkout.payment_requested") throw new ConflictError("Unexpected Payment checkout event");
      return database.$transaction((tx) => processCheckoutEvent(tx, event, async () => {
        const order = await getOrder(event.data.orderId);
        if (!order.eventDriven || !order.items || JSON.stringify([...order.items].sort((a, b) => a.productId.localeCompare(b.productId))) !==
            JSON.stringify([...event.data.reservations].sort((a, b) => a.productId.localeCompare(b.productId)))) {
          throw new ConflictError("Reservation differs from checkout Order");
        }
        const payment = await create(order.userId, { orderId: order.id }, `checkout:${order.id}:create`, true);
        logger.debug({ eventId: event.eventId, orderId: order.id, paymentId: payment.id, idempotencyKey: `checkout:${order.id}:create` }, "checkout payment attempt");
        // Create replay is an immutable response snapshot, not current lifecycle state.
        const current = await getPayment(database, payment.id);
        await command(payment.id, order.userId, current.status === "FAILED" || current.status === "SUCCEEDED" ? current.status : outcome, "ADMIN", false, event, tx);
        const result = await tx.outboxEvent.findUniqueOrThrow({ where: { deduplicationKey: `checkout:${event.eventId}` } });
        return deserializeIntegrationEvent(result.payload);
      }, logger), transactionOptions);
    },
    create,
    confirm: (id: string, userId: string, role?: string) => command(id, userId, "SUCCEEDED", role),
    fail: (id: string, userId: string, role?: string) => command(id, userId, "FAILED", role),
    refund: (id: string, userId: string, role?: string) => command(id, userId, "REFUNDED", role),
    get: async (id: string, userId: string) => {
      const payment = await getPayment(database, id);
      ensureOwnership(payment, userId);
      return toPaymentResponse(payment);
    },
    list: async (userId: string) => (await database.payment.findMany({ where: { userId }, orderBy: { createdAt: "desc" } })).map(toPaymentResponse),
  };
}

const service = buildPaymentService(prisma, paymentProvider);
export const createPaymentService = service.create;
export const confirmPaymentService = service.confirm;
export const failPaymentService = service.fail;
export const refundPaymentService = service.refund;
export const getPaymentByIdService = service.get;
export const getMyPaymentsService = service.list;
export const handlePaymentCheckout = service.checkout;
