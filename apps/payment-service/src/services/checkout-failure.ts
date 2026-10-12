import { createIntegrationEvent, type KnownIntegrationEvent } from "@shared/utils";

export async function paymentCompensationFailure(event: KnownIntegrationEvent, _error: unknown, retryable: boolean) {
  return event.eventType === "checkout.refund_requested" ? createIntegrationEvent({ eventType: "payment.refund_failed",
    correlationId: event.correlationId, causationId: event.eventId,
    data: { orderId: event.data.orderId, paymentId: event.data.paymentId, failureCode: "REFUND_FAILED", retryable } }) : null;
}
