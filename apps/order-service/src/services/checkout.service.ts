import { ConflictError, NotFoundError, checkoutEventFingerprint, createIntegrationEvent, processCheckoutEvent, type EventType, type KnownIntegrationEvent } from "@shared/utils";
import prisma from "../config/db.js";
import type { Prisma, PrismaClient } from "../generated/prisma/index.js";
import { logger } from "../logger.js";
import { traced, SpanKind, recordSagaState } from "@shared/utils";
import { classifySagaEvent } from "../domain/checkout-saga.js";
import { completeOrderTransition } from "./order.service.js";

export const sagaEventTypes: readonly EventType[] = ["inventory.reserved", "inventory.reservation_failed", "payment.succeeded", "payment.failed",
  "payment.refunded", "inventory.released", "payment.refund_failed", "inventory.release_failed", "order.cancelled"];

async function lockedSaga(tx: Prisma.TransactionClient, event: KnownIntegrationEvent) {
  await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${event.data.orderId} FOR UPDATE`;
  const order = await tx.order.findUnique({ where: { id: event.data.orderId }, include: { items: true } });
  if (!order) throw new NotFoundError("Order not found");
  if (!order.eventDriven) throw new ConflictError("Order does not use event-driven checkout");
  let saga = await tx.checkoutSaga.findUnique({ where: { orderId: order.id } });
  if (!saga || saga.failedStep === "LEGACY") {
    // Legacy Phase 7 payment facts imply its preceding reservation step.
    const payment = event.eventType === "payment.succeeded" || event.eventType === "payment.failed";
    const released = event.eventType === "inventory.released" && order.status === "CANCELLED";
    const data = {
      orderId: order.id, correlationId: event.correlationId,
      state: released ? "COMPENSATED" as const : ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status) ? "COMPLETED" as const : payment ? "PAYING" as const : "RESERVING" as const,
      inventoryReserved: payment || released, inventoryReleased: released,
    };
    if (saga && saga.correlationId !== event.correlationId) throw new ConflictError("Saga correlation differs from workflow");
    saga = saga ? await tx.checkoutSaga.update({ where: { id: saga.id }, data: { ...data, failedStep: null, failureCode: null } }) : await tx.checkoutSaga.create({ data });
  }
  if (saga.correlationId !== event.correlationId) throw new ConflictError("Saga correlation differs from workflow");
  return { order, saga };
}

function sameItems(a: { productId: string; quantity: number }[], b: { productId: string; quantity: number }[]) {
  return a.length === b.length && a.every((item) => b.some((other) => other.productId === item.productId && other.quantity === item.quantity));
}

/** Financial acknowledgement survives transient failure of the local confirmation. */
async function stagePaymentSuccess(event: KnownIntegrationEvent, database: PrismaClient) {
  if (event.eventType !== "payment.succeeded") return;
  const blocked = await database.$transaction(async (tx) => {
    const { saga, order } = await lockedSaga(tx, event);
    const receipt = await tx.checkoutEvent.findUnique({ where: { eventId: event.eventId } });
    if (receipt && receipt.fingerprint !== checkoutEventFingerprint(event)) throw new ConflictError("Event ID reused with different content");
    if (receipt) return;
    if (saga.paymentEventId === event.eventId && saga.paymentEventFingerprint !== checkoutEventFingerprint(event)) throw new ConflictError("Event ID reused with different content");
    const moneyConflict = !order.totalAmount.equals(event.data.amount);
    if (saga.paymentId && saga.paymentId !== event.data.paymentId) throw new ConflictError("Saga Payment identity differs");
    const classification = classifySagaEvent(saga, event.eventType);
    if (classification === "conflict") throw new ConflictError("Obsolete checkout outcome");
    if (classification !== "transition") {
      if (moneyConflict) throw new ConflictError("Payment result differs from Order");
      return;
    }
    const refund = order.status === "CANCELLED" || order.pendingStatus === "CANCELLED";
    const unsafe = moneyConflict || !!order.pendingStatus && !refund || order.status === "PENDING" && order.reservationConsumed;
    const next = await tx.checkoutSaga.update({ where: { id: saga.id }, data: {
      paymentId: event.data.paymentId, paymentOutcome: "SUCCEEDED", lastEventId: event.eventId,
      paymentEventId: event.eventId, paymentEventFingerprint: checkoutEventFingerprint(event),
      state: unsafe ? "FAILED" : refund ? "REFUNDING" : "CONFIRMING",
      ...(unsafe ? { failureCode: moneyConflict ? "PAYMENT_DATA_CONFLICT" : "ORDER_COMMAND_CONFLICT", failedStep: "CONFIRMATION", compensationRetryable: false } : refund ? { failureCode: "ORDER_CONFIRMATION_INVALID" } : {}),
    } });
    recordSagaState(next.state);
    logger.info({ sagaId: saga.id, orderId: order.id, previousState: saga.state, nextState: next.state,
      eventId: event.eventId, eventType: event.eventType, correlationId: event.correlationId, causationId: event.causationId,
      paymentOutcome: next.paymentOutcome, failureCode: next.failureCode }, "checkout Saga recorded payment acknowledgement");
    return unsafe;
  });
  if (blocked) throw new ConflictError("Order cannot safely complete checkout", undefined, "SAGA_MANUAL_REVIEW");
}

export async function handleOrderCheckout(event: KnownIntegrationEvent, database: PrismaClient = prisma) {
  return traced("checkout saga", SpanKind.INTERNAL, { "event.type": event.eventType }, () => handleSagaEvent(event, database));
}
async function handleSagaEvent(event: KnownIntegrationEvent, database: PrismaClient) {
  if (!sagaEventTypes.includes(event.eventType)) throw new ConflictError("Unexpected Order checkout event");
  await stagePaymentSuccess(event, database);
  if (event.eventType !== "payment.succeeded") {
    const legacy = await database.checkoutSaga.findUnique({ where: { orderId: event.data.orderId } });
    if (legacy?.failedStep === "LEGACY") await database.$transaction(async (tx) => {
      const receipt = await tx.checkoutEvent.findUnique({ where: { eventId: event.eventId } });
      if (receipt && receipt.fingerprint !== checkoutEventFingerprint(event)) throw new ConflictError("Event ID reused with different content");
      await lockedSaga(tx, event);
    });
  }
  return database.$transaction((tx) => processCheckoutEvent(tx, event, async () => {
    const { order, saga } = await lockedSaga(tx, event);
    const classification = classifySagaEvent(saga, event.eventType);
    const metadata = { correlationId: event.correlationId, causationId: event.eventId };
    logger.info({ sagaId: saga.id, orderId: order.id, sagaState: saga.state, eventId: event.eventId, eventType: event.eventType,
      ...metadata, causationId: event.causationId, classification, compensationStatus: saga.compensationError }, "checkout Saga event classified");
    if (classification === "conflict") throw new ConflictError("Obsolete checkout outcome");
    if (classification !== "transition") return null;
    const update = async (data: Prisma.CheckoutSagaUpdateInput) => {
      const next = await tx.checkoutSaga.update({ where: { id: saga.id }, data: { ...data, lastEventId: event.eventId } });
      recordSagaState(next.state);
      logger.info({ sagaId: saga.id, orderId: order.id, previousState: saga.state, nextState: next.state,
        eventId: event.eventId, eventType: event.eventType, ...metadata, causationId: event.causationId, compensationStatus: next.compensationError }, "checkout Saga progressed");
    };
    const cancel = async () => {
      if (order.reservationConsumed || order.pendingStatus && order.pendingStatus !== "CANCELLED" || !["PENDING", "CONFIRMED", "CANCELLED"].includes(order.status)) {
        throw new ConflictError("Order cancellation requires manual review", undefined, "SAGA_CANCELLATION_BLOCKED");
      }
      if (order.status !== "CANCELLED") await completeOrderTransition(order, "CANCELLED", tx, order.pendingStatus);
      return createIntegrationEvent({ eventType: "order.cancelled", ...metadata, data: {
        orderId: order.id, userId: order.userId, items: order.items.map(({ productId, quantity }) => ({ productId, quantity })),
      } });
    };
    switch (event.eventType) {
      case "inventory.reserved":
        if (!sameItems(event.data.reservations, order.items)) throw new ConflictError("Reservation differs from Order");
        await update({ state: "PAYING", inventoryReserved: true });
        return createIntegrationEvent({ eventType: "checkout.payment_requested", ...metadata, data: event.data });
      case "inventory.reservation_failed":
        if (!order.items.some((item) => item.productId === event.data.productId && item.quantity === event.data.quantity)) throw new ConflictError("Inventory failure differs from Order");
        await update({ state: "CANCELLED", failureCode: event.data.reason, failedStep: "INVENTORY_RESERVATION" });
        return cancel();
      case "payment.failed":
        if (!order.totalAmount.equals(event.data.amount) || (saga.paymentId && saga.paymentId !== event.data.paymentId)) throw new ConflictError("Payment result differs from Order");
        await update({ state: "RELEASING", paymentId: event.data.paymentId, paymentOutcome: "FAILED", failureCode: event.data.failureCode ?? "PAYMENT_DECLINED" });
        return cancel();
      case "payment.succeeded": {
        if (saga.state !== "REFUNDING") {
          if (order.pendingStatus || order.reservationConsumed && order.status === "PENDING") {
            await update({ state: "REFUNDING", failureCode: "ORDER_CONFIRMATION_INVALID" });
          } else {
            if (order.status === "PENDING") {
              try { await completeOrderTransition(order, "CONFIRMED", tx); }
              catch (err) {
                if (!(err instanceof ConflictError)) throw err;
                await update({ state: "REFUNDING", failureCode: "ORDER_CONFIRMATION_INVALID" });
                return createIntegrationEvent({ eventType: "checkout.refund_requested", ...metadata, data: { orderId: order.id, paymentId: event.data.paymentId } });
              }
            }
            await update({ state: "COMPLETED", failedStep: null, compensationError: null, compensationRetryable: null });
            return createIntegrationEvent({ eventType: "order.confirmed", ...metadata, data: { orderId: order.id, userId: order.userId } });
          }
        }
        return createIntegrationEvent({ eventType: "checkout.refund_requested", ...metadata, data: { orderId: order.id, paymentId: event.data.paymentId } });
      }
      case "payment.refunded": {
        if (saga.paymentId !== event.data.paymentId || !order.totalAmount.equals(event.data.amount)) throw new ConflictError("Refund differs from Saga Payment");
        const release = saga.inventoryReserved && !saga.inventoryReleased;
        await update({ paymentOutcome: "REFUNDED", state: release ? "RELEASING" : "COMPENSATED", failedStep: null, compensationError: null, compensationRetryable: null });
        return release || order.status !== "CANCELLED" ? cancel() : null;
      }
      case "inventory.released":
        if (!sameItems(event.data.reservations, order.items)) throw new ConflictError("Release differs from Order");
        await update({ inventoryReleased: true, state: saga.state === "REFUNDING" || saga.failedStep === "REFUND" ? saga.state : "COMPENSATED",
          ...(saga.failedStep !== "REFUND" ? { failedStep: null, compensationError: null, compensationRetryable: null } : {}) });
        return null;
      case "inventory.release_failed":
      case "payment.refund_failed":
        if (event.eventType === "payment.refund_failed" && saga.paymentId !== event.data.paymentId) throw new ConflictError("Refund failure differs from Saga Payment");
        await update({ state: event.data.retryable ? saga.state : "FAILED", failedStep: event.eventType === "inventory.release_failed" ? "RELEASE" : "REFUND",
          compensationError: event.data.failureCode, compensationRetryable: event.data.retryable });
        return null;
      default: return null;
    }
  }, logger));
}

export async function recordSagaFailure(event: KnownIntegrationEvent, error: unknown, retryable: boolean) {
  if (event.eventType === "payment.succeeded" && retryable) {
    await prisma.checkoutSaga.updateMany({ where: { orderId: event.data.orderId, state: "CONFIRMING", paymentId: event.data.paymentId },
      data: { failedStep: "CONFIRMATION", compensationError: "CONFIRMATION_RETRY_REQUIRED", compensationRetryable: true } });
  }
  if (event.eventType === "payment.refunded" && (retryable || error instanceof ConflictError && error.code === "SAGA_CANCELLATION_BLOCKED")) {
    const order = await prisma.order.findUnique({ where: { id: event.data.orderId } });
    if (!order?.eventDriven || !order.totalAmount.equals(event.data.amount)) return null;
    await prisma.checkoutSaga.updateMany({ where: { orderId: event.data.orderId, correlationId: event.correlationId, state: { in: ["REFUNDING", "FAILED"] }, paymentId: event.data.paymentId },
      data: { paymentOutcome: "REFUNDED", state: retryable ? "REFUNDING" : "FAILED", failedStep: "RELEASE",
        compensationError: "CANCELLATION_BLOCKED", compensationRetryable: retryable } });
  }
  return null;
}

export async function getCheckoutSaga(orderId: string) {
  const saga = await prisma.checkoutSaga.findUnique({ where: { orderId } });
  if (!saga) throw new NotFoundError("Checkout Saga not found");
  return { ...saga, terminal: ["COMPLETED", "CANCELLED", "COMPENSATED"].includes(saga.state), requiresAttention: saga.state === "FAILED" };
}
