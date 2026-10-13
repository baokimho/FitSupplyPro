import { BadRequestError, ConflictError, NotFoundError, createIntegrationEvent, processCheckoutEvent, type KnownIntegrationEvent } from "@shared/utils";
import prisma from "../config/db.js";
import { logger } from "../logger.js";
import { reserveInventoryStockService, releaseInventoryStockService } from "./inventory.service.js";

export async function handleInventoryCheckout(event: KnownIntegrationEvent) {
  if (event.eventType !== "order.created" && event.eventType !== "order.cancelled") throw new ConflictError("Unexpected Inventory checkout event");
  return prisma.$transaction((tx) => processCheckoutEvent(tx, event, async () => {
    const { orderId, items } = event.data;
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`inventory.checkout:${orderId}`}, 0))`;
    const metadata = { correlationId: event.correlationId, causationId: event.eventId };
    if (event.eventType === "order.cancelled") {
      const released = [];
      for (const item of [...items].sort((a, b) => a.productId.localeCompare(b.productId))) {
        const reservation = await tx.inventoryOperation.findUnique({ where: { operationId: `${orderId}:reserve:${item.productId}` } });
        if (!reservation) continue; // Inventory failure rolled back the entire order batch.
        if (reservation.quantity !== item.quantity) throw new ConflictError("Cancellation differs from reservation");
        logger.debug({ eventId: event.eventId, orderId, operationId: `${orderId}:release:${item.productId}` }, "checkout inventory release");
        await releaseInventoryStockService(item.productId, { quantity: item.quantity, reason: "Async Order cancelled", operationId: `${orderId}:release:${item.productId}` }, tx);
        released.push(item);
      }
      return released.length ? createIntegrationEvent({ eventType: "inventory.released", ...metadata, data: { orderId, reservations: released } }) : null;
    }
    // Reuse per-product conditional mutations; savepoint rolls back all partial reservations.
    await tx.$executeRaw`SAVEPOINT checkout_reservation`;
    for (const item of [...items].sort((a, b) => a.productId.localeCompare(b.productId))) {
      try {
        logger.debug({ eventId: event.eventId, orderId, operationId: `${orderId}:reserve:${item.productId}` }, "checkout inventory reservation");
        await reserveInventoryStockService(item.productId, { quantity: item.quantity, reason: "Async checkout", operationId: `${orderId}:reserve:${item.productId}` }, tx);
      } catch (err) {
        if (!(err instanceof NotFoundError) && !(err instanceof BadRequestError && err.message === "Insufficient stock")) throw err;
        await tx.$executeRaw`ROLLBACK TO SAVEPOINT checkout_reservation`;
        return createIntegrationEvent({ eventType: "inventory.reservation_failed", ...metadata, data: {
          orderId, productId: item.productId, quantity: item.quantity,
          reason: err instanceof NotFoundError ? "PRODUCT_NOT_FOUND" : "INSUFFICIENT_STOCK",
        } });
      }
    }
    return createIntegrationEvent({ eventType: "inventory.reserved", ...metadata, data: { orderId, reservations: items } });
  }, logger), { timeout: 15000 });
}

export async function inventoryCompensationFailure(event: KnownIntegrationEvent, _error: unknown, retryable: boolean) {
  return event.eventType === "order.cancelled" ? createIntegrationEvent({ eventType: "inventory.release_failed",
    correlationId: event.correlationId, causationId: event.eventId, data: { orderId: event.data.orderId, failureCode: "RELEASE_FAILED", retryable } }) : null;
}
