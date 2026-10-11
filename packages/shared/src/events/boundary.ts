import { randomUUID } from "node:crypto";
import { TextDecoder } from "node:util";
import { z } from "zod";
import { getCorrelation } from "../http/correlation.js";
import { integrationEventEnvelopeSchema } from "./envelope.js";
import {
  integrationEventRegistry, knownIntegrationEventSchema,
  type EventType, type IntegrationEventFor, type KnownIntegrationEvent,
} from "./registry.js";

export type IntegrationEventErrorCode =
  | "INVALID_UTF8" | "MALFORMED_JSON" | "INVALID_ENVELOPE"
  | "UNKNOWN_EVENT_TYPE" | "UNSUPPORTED_EVENT_VERSION" | "INVALID_PAYLOAD";

/** Contract failures, not HTTP errors. Fixed messages never include message bodies. */
export class IntegrationEventError extends Error {
  constructor(public readonly code: IntegrationEventErrorCode, public readonly issues: readonly z.core.$ZodIssue[] = []) {
    super(`Integration event rejected: ${code}`);
    this.name = "IntegrationEventError";
  }
}

export type IntegrationEventParseResult =
  | { success: true; data: KnownIntegrationEvent }
  | { success: false; error: IntegrationEventError };

/** Validation order makes classification stable even when several fields are invalid. */
export function safeParseIntegrationEvent(input: unknown): IntegrationEventParseResult {
  const envelope = integrationEventEnvelopeSchema.safeParse(input);
  if (!envelope.success) {
    return { success: false, error: new IntegrationEventError("INVALID_ENVELOPE", envelope.error.issues) };
  }
  const schema = integrationEventRegistry.find((entry) => entry.shape.eventType.value === envelope.data.eventType);
  if (!schema) return { success: false, error: new IntegrationEventError("UNKNOWN_EVENT_TYPE") };
  if (schema.shape.eventVersion.value !== envelope.data.eventVersion) {
    return { success: false, error: new IntegrationEventError("UNSUPPORTED_EVENT_VERSION") };
  }
  const producer = schema.shape.producer.safeParse(envelope.data.producer);
  if (!producer.success) {
    return { success: false, error: new IntegrationEventError("INVALID_ENVELOPE", producer.error.issues) };
  }
  const event = knownIntegrationEventSchema.safeParse(envelope.data);
  if (!event.success) {
    return { success: false, error: new IntegrationEventError("INVALID_PAYLOAD", event.error.issues) };
  }
  return { success: true, data: event.data };
}

export function parseIntegrationEvent(input: unknown): KnownIntegrationEvent {
  const result = safeParseIntegrationEvent(input);
  if (!result.success) throw result.error;
  return result.data;
}

export type NewIntegrationEvent = {
  [T in EventType]: Pick<IntegrationEventFor<T>, "eventType" | "data"> & {
    correlationId?: string;
    causationId: string | null;
  }
}[EventType];

/** Creates a new fact once; retries must reuse the stored event, including its ID. */
export function createIntegrationEvent(input: NewIntegrationEvent): KnownIntegrationEvent {
  const schema = integrationEventRegistry.find((entry) => entry.shape.eventType.value === input.eventType);
  if (!schema) throw new IntegrationEventError("UNKNOWN_EVENT_TYPE");
  return parseIntegrationEvent({
    eventId: randomUUID(), eventType: input.eventType, eventVersion: schema.shape.eventVersion.value,
    occurredAt: new Date().toISOString(),
    correlationId: input.correlationId === undefined ? getCorrelation()?.traceId : input.correlationId,
    causationId: input.causationId,
    producer: { service: schema.shape.producer.shape.service.value }, data: input.data,
  });
}

/** Validate on output too; static types cannot protect against invalid runtime values. */
export function serializeIntegrationEvent(event: KnownIntegrationEvent): Buffer {
  return Buffer.from(JSON.stringify(parseIntegrationEvent(event)), "utf8");
}

/** Broker bytes are untrusted. Reject invalid UTF-8 rather than replacing characters. */
export function deserializeIntegrationEvent(content: string | Uint8Array): KnownIntegrationEvent {
  let json: string;
  if (typeof content === "string") json = content;
  else {
    try { json = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(content); }
    catch { throw new IntegrationEventError("INVALID_UTF8"); }
  }
  let decoded: unknown;
  try { decoded = JSON.parse(json); }
  catch { throw new IntegrationEventError("MALFORMED_JSON"); }
  return parseIntegrationEvent(decoded);
}
