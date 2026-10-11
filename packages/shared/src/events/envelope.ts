import { z } from "zod";
import { validCorrelationId } from "../http/correlation.js";

// Same UUID policy as HTTP correlation; no nil/max UUIDs or coercion.
export const eventUuidSchema = z.string().refine(validCorrelationId, "Must be a UUID");

/** Transport-independent metadata. Unknown additive fields are ignored by readers. */
export const integrationEventEnvelopeSchema = z.object({
  eventId: eventUuidSchema,
  eventType: z.string().regex(/^[a-z][a-z0-9]*\.[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/),
  eventVersion: z.number().int().positive(),
  occurredAt: z.iso.datetime({ offset: false, local: false }),
  correlationId: eventUuidSchema,
  causationId: eventUuidSchema.nullable(),
  producer: z.object({ service: z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*-service$/) }),
  data: z.record(z.string(), z.unknown()),
});

export type IntegrationEventEnvelope = z.infer<typeof integrationEventEnvelopeSchema>;
export type IntegrationEvent<TType extends string, TPayload, TVersion extends number = number> =
  Omit<IntegrationEventEnvelope, "eventType" | "eventVersion" | "data"> & {
    eventType: TType;
    eventVersion: TVersion;
    data: TPayload;
  };
