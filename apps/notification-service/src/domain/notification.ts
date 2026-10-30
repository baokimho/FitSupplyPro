import { DeliveryPoisonError, retryDelay, type KnownIntegrationEvent } from "@shared/utils";

export const notificationEventTypes = ["order.confirmed", "order.cancelled", "shipment.shipped", "shipment.delivered"] as const;

export function buildNotification(event: KnownIntegrationEvent) {
  switch (event.eventType) {
    case "order.confirmed":
      return { userId: event.data.userId, type: "ORDER_CONFIRMED" as const,
        title: "Order confirmed", message: `Order ${event.data.orderId} has been confirmed.` };
    case "order.cancelled":
      return { userId: event.data.userId, type: "ORDER_CANCELLED" as const,
        title: "Order cancelled", message: `Order ${event.data.orderId} has been cancelled.` };
    case "shipment.shipped":
      return { userId: event.data.userId, type: "ORDER_SHIPPED" as const,
        title: "Order shipped", message: `Shipment ${event.data.shipmentId} has shipped.` };
    case "shipment.delivered":
      return { userId: event.data.userId, type: "ORDER_DELIVERED" as const,
        title: "Order delivered", message: `Shipment ${event.data.shipmentId} has been delivered.` };
    default: throw new DeliveryPoisonError();
  }
}

export const deliveryIdentity = (deliveryId: string) => `delivery:${deliveryId}`;

export class EmailProviderError extends Error {
  constructor(readonly code: "TRANSIENT" | "PERMANENT" | "TIMEOUT") {
    super("Email provider failed");
  }
}

/** Never persist or log provider-controlled text, response bodies or credentials. */
export function emailFailure(error: unknown) {
  const code = error instanceof EmailProviderError ? error.code : "UNKNOWN";
  return { retryable: code !== "PERMANENT", summary: `EMAIL_${code}` };
}

export type EmailDeliveryPolicy = { maxAttempts: number; baseDelayMs: number; maxDelayMs: number; timeoutMs: number; claimMs: number; pollMs: number };
export const defaultEmailPolicy: EmailDeliveryPolicy = { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 30000, timeoutMs: 2000, claimMs: 10000, pollMs: 500 };

export function deliveryFailureState(error: unknown, attempt: number, policy: EmailDeliveryPolicy, now = Date.now(), random = Math.random) {
  const failure = emailFailure(error);
  const retry = failure.retryable && attempt < policy.maxAttempts;
  return { status: retry ? "PENDING" as const : "FAILED" as const, lastError: failure.summary,
    nextAttemptAt: new Date(now + (retry ? retryDelay(attempt, policy, random) : 0)) };
}
