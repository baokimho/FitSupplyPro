import { ConflictError, NotFoundError, createIntegrationEvent, processCheckoutEvent, type KnownIntegrationEvent } from "@shared/utils";
import prisma from "../config/db.js";
import { completeOrderTransition } from "./order.service.js";

export async function handleOrderCheckout(event: KnownIntegrationEvent) {
  if (event.eventType !== "payment.succeeded" && event.eventType !== "payment.failed" &&
      event.eventType !== "inventory.reservation_failed" && event.eventType !== "inventory.released") {
    throw new ConflictError("Unexpected Order checkout event");
  }
  return prisma.$transaction((tx) => processCheckoutEvent(tx, event, async () => {
    const { orderId } = event.data;
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new NotFoundError("Order not found");
    if (!order.eventDriven) throw new ConflictError("Order does not use event-driven checkout");
    if (event.eventType === "inventory.released") {
      if (order.status !== "CANCELLED") throw new ConflictError("Unexpected release for active Order");
      return null;
    }
    if (event.eventType === "inventory.reservation_failed") {
      if (!order.items.some((item) => item.productId === event.data.productId && item.quantity === event.data.quantity)) {
        throw new ConflictError("Inventory failure differs from Order");
      }
    } else if (!order.totalAmount.equals(event.data.amount) || event.data.currency !== "USD") {
      throw new ConflictError("Payment result differs from Order");
    }
    const status = event.eventType === "payment.succeeded" ? "CONFIRMED" : "CANCELLED";
    if (order.status === status) return null;
    if (order.status !== "PENDING" || order.pendingStatus || order.reservationConsumed) throw new ConflictError("Obsolete checkout outcome");
    await completeOrderTransition(order, status, tx);
    const metadata = { correlationId: event.correlationId, causationId: event.eventId };
    return status === "CONFIRMED"
      ? createIntegrationEvent({ eventType: "order.confirmed", ...metadata, data: { orderId, userId: order.userId } })
      : createIntegrationEvent({ eventType: "order.cancelled", ...metadata, data: {
        orderId, userId: order.userId, items: order.items.map(({ productId, quantity }) => ({ productId, quantity })),
      } });
  }));
}
