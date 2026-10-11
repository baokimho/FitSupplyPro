import { z } from "zod";
import { eventUuidSchema, integrationEventEnvelopeSchema } from "./envelope.js";

const userIdSchema = z.string().min(1).refine((value) => value.trim().length > 0, "User id must not be blank");
const quantitySchema = z.number().int().positive().max(2_147_483_647);
// Canonical decimal string, matching current Decimal(10,2); never float money.
const moneySchema = z.string().regex(/^(?:0|[1-9]\d{0,7})\.\d{2}$/);
const itemsSchema = z.array(z.object({ productId: eventUuidSchema, quantity: quantitySchema }))
  .min(1).refine((items) => new Set(items.map((item) => item.productId)).size === items.length,
    "Products must be aggregated before publication");
const reservationDataSchema = z.object({ orderId: eventUuidSchema, reservations: itemsSchema });
const paymentDataSchema = z.object({
  orderId: eventUuidSchema, paymentId: eventUuidSchema,
  amount: moneySchema, currency: z.literal("USD"),
});
const orderDataSchema = z.object({ orderId: eventUuidSchema, userId: userIdSchema });

function eventSchema<T extends string, S extends string, D extends z.ZodType>(eventType: T, service: S, data: D) {
  return integrationEventEnvelopeSchema.extend({
    eventType: z.literal(eventType), eventVersion: z.literal(1),
    producer: z.object({ service: z.literal(service) }), data,
  });
}

/** One declaration owns name, version, producer and runtime/TypeScript payload. */
export const integrationEventRegistry = Object.freeze([
  eventSchema("inventory.reserved", "inventory-service", reservationDataSchema),
  eventSchema("inventory.reservation_failed", "inventory-service", z.object({
    orderId: eventUuidSchema, productId: eventUuidSchema, quantity: quantitySchema,
    reason: z.enum(["INSUFFICIENT_STOCK", "PRODUCT_NOT_FOUND"]),
  })),
  eventSchema("inventory.released", "inventory-service", reservationDataSchema),
  eventSchema("inventory.consumed", "inventory-service", reservationDataSchema),
  eventSchema("payment.succeeded", "payment-service", paymentDataSchema),
  eventSchema("payment.failed", "payment-service", paymentDataSchema.extend({
    failureCode: z.string().regex(/^[A-Z][A-Z0-9_]*$/).max(128).nullable(),
  })),
  eventSchema("payment.refunded", "payment-service", paymentDataSchema),
  eventSchema("order.created", "order-service", orderDataSchema.extend({
    items: itemsSchema, totalAmount: moneySchema, currency: z.literal("USD"),
  })),
  eventSchema("order.confirmed", "order-service", orderDataSchema),
  eventSchema("order.cancelled", "order-service", orderDataSchema.extend({ items: itemsSchema })),
  eventSchema("order.processing_started", "order-service", orderDataSchema),
] as const);

export const knownIntegrationEventSchema = z.discriminatedUnion("eventType", integrationEventRegistry);
export type KnownIntegrationEvent = z.infer<typeof knownIntegrationEventSchema>;
export type EventType = KnownIntegrationEvent["eventType"];
export type IntegrationEventFor<T extends EventType> = Extract<KnownIntegrationEvent, { eventType: T }>;
export type PayloadFor<T extends EventType> = IntegrationEventFor<T>["data"];
