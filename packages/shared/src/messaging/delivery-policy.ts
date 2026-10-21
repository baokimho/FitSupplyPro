import { createHash } from "node:crypto";
import { ConflictError } from "../errors/httpErrors.js";
import { deserializeIntegrationEvent, IntegrationEventError } from "../events/boundary.js";
import { canRetry } from "../resilience/failure.js";
import type { ConsumeMessage, GetMessage } from "amqplib";
import { integrationEventEnvelopeSchema } from "../events/envelope.js";
import { DOMAIN_ROUTING_KEYS } from "./topology.js";

export const MAX_REPLAY_COUNT = 3;
export const REPLAY_COUNT_HEADER = "x-fitsupply-replay-count";
export const FAILURE_HEADER = "x-fitsupply-failure";
export type DeliveryFailureClass = "TRANSIENT" | "PERMANENT" | "POISON";
export type DeliveryMessage = Pick<ConsumeMessage | GetMessage, "content" | "fields" | "properties">;

export class DeliveryPoisonError extends ConflictError {
  constructor(code = "UNEXPECTED_EVENT_TYPE") { super(code === "UNEXPECTED_EVENT_TYPE" ? "Unexpected checkout event type" : "Invalid replay metadata", undefined, code); }
}
export class DeliveryBudgetExhausted extends Error {
  readonly code = "DELIVERY_BUDGET_EXHAUSTED";
  constructor() { super("Durable delivery budget exhausted"); }
}

export function deliveryFailureClass(error: unknown): DeliveryFailureClass {
  if (error instanceof IntegrationEventError || error instanceof DeliveryPoisonError) return "POISON";
  return error instanceof DeliveryBudgetExhausted || canRetry(error, true) ? "TRANSIENT" : "PERMANENT";
}

export const messageKey = (content: Uint8Array) => createHash("sha256").update(content).digest("hex");
export function replayCount(message: DeliveryMessage): number {
  const count: unknown = message.properties.headers?.[REPLAY_COUNT_HEADER] ?? 0;
  if (typeof count !== "number" || !Number.isInteger(count) || count < 0 || count > MAX_REPLAY_COUNT) throw new DeliveryPoisonError("INVALID_REPLAY_COUNT");
  return count;
}
export function quarantineId(queue: string, message: DeliveryMessage): string {
  return messageKey(Buffer.from(`${queue}\0${message.properties.headers?.[REPLAY_COUNT_HEADER] ?? 0}\0${messageKey(message.content)}`));
}

export function deliveryErrorSummary(error: unknown) {
  const failureClass = deliveryFailureClass(error);
  const rawCode: unknown = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
  const errorCode = typeof rawCode === "string" && /^[A-Z0-9_.-]{1,80}$/.test(rawCode) ? rawCode : "UNEXPECTED_ERROR";
  return { failureClass, errorCode,
    errorName: error instanceof IntegrationEventError ? "IntegrationEventError" : error instanceof Error ? error.constructor.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 80) : "UnknownError",
    errorMessage: failureClass === "POISON" ? "Invalid message contract or consumer route" : failureClass === "TRANSIENT" ? "Transient processing failure; inspect correlated service logs" : "Non-retryable processing failure; inspect correlated service logs" };
}

/** Validated envelope identity can diagnose a known contract with invalid version/payload. */
export function deliveryEventIdentity(content: Uint8Array) {
  let event;
  try { event = deserializeIntegrationEvent(content); }
  catch {
    try {
      const envelope = integrationEventEnvelopeSchema.safeParse(JSON.parse(Buffer.from(content).toString("utf8")));
      if (envelope.success && (DOMAIN_ROUTING_KEYS as readonly string[]).includes(envelope.data.eventType) &&
          ["order-service", "inventory-service", "payment-service"].includes(envelope.data.producer.service)) event = envelope.data;
    } catch { /* Never echo poison bytes or arbitrary payload fields. */ }
  }
  return event ? { eventId: event.eventId, eventType: event.eventType, eventVersion: event.eventVersion,
    correlationId: event.correlationId, causationId: event.causationId, producer: event.producer } : undefined;
}

export function deliveryDiagnostic(queue: string, message: DeliveryMessage, error: unknown, attempts: number, maxAttempts: number) {
  const event = deliveryEventIdentity(message.content);
  const originalRoutingKey: unknown = message.properties.headers?.["x-fitsupply-original-routing-key"] ?? message.fields.routingKey;
  const routingKey = typeof originalRoutingKey === "string" && /^[a-zA-Z0-9_.-]{1,200}$/.test(originalRoutingKey) ? originalRoutingKey : "unknown";
  return { id: quarantineId(queue, message), consumer: queue, service: queue.split(".")[0], queue, routingKey,
    attempt: attempts, retryCount: Math.max(0, attempts - 1), maxAttempts, ...deliveryErrorSummary(error),
    failedAt: new Date().toISOString(),
    ...event };
}
