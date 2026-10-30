import { randomUUID } from "node:crypto";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  integrationEventRegistry, type EventType, type KnownIntegrationEvent, type PayloadFor,
} from "./registry.js";
import { deserializeIntegrationEvent, parseIntegrationEvent, safeParseIntegrationEvent, serializeIntegrationEvent } from "./boundary.js";

const orderId = randomUUID();
const productId = randomUUID();
const reservations = [{ productId, quantity: 2 }];
const payment = { orderId, paymentId: randomUUID(), amount: "19.98", currency: "USD" as const };
const order = { orderId, userId: "e2e-admin-user" };
const payloads = {
  "inventory.reserved": { orderId, reservations },
  "inventory.reservation_failed": { orderId, productId, quantity: 2, reason: "INSUFFICIENT_STOCK" },
  "inventory.released": { orderId, reservations },
  "inventory.consumed": { orderId, reservations },
  "inventory.release_failed": { orderId, failureCode: "RELEASE_FAILED", retryable: true },
  "checkout.payment_requested": { orderId, reservations },
  "checkout.refund_requested": { orderId, paymentId: payment.paymentId },
  "payment.succeeded": payment,
  "payment.failed": { ...payment, failureCode: "FAKE_DECLINED" },
  "payment.refunded": payment,
  "payment.refund_failed": { orderId, paymentId: payment.paymentId, failureCode: "REFUND_FAILED", retryable: false },
  "order.created": { ...order, items: reservations, totalAmount: "19.98", currency: "USD" },
  "order.confirmed": order,
  "order.cancelled": { ...order, items: reservations },
  "order.processing_started": order,
  "shipment.shipped": { ...order, shipmentId: randomUUID() },
  "shipment.delivered": { ...order, shipmentId: randomUUID() },
} satisfies { [T in EventType]: PayloadFor<T> };

function event(eventType: EventType, data: unknown = payloads[eventType]) {
  const schema = integrationEventRegistry.find((entry) => entry.shape.eventType.value === eventType);
  return {
    eventId: randomUUID(), eventType, eventVersion: 1,
    occurredAt: "2026-10-11T09:00:00.000Z", correlationId: randomUUID(), causationId: randomUUID(),
    producer: { service: schema?.shape.producer.shape.service.value }, data,
  };
}

function invalidPayload(eventType: EventType, data: unknown) {
  const result = safeParseIntegrationEvent(event(eventType, data));
  expect(result.success).toBe(false);
  if (!result.success) expect(result.error.code).toBe("INVALID_PAYLOAD");
}

describe("registered business facts", () => {
  for (const eventType of Object.keys(payloads) as EventType[]) {
    describe(eventType, () => {
      it("accepts complete payload and schema version", () => {
        const input = event(eventType);
        expect(parseIntegrationEvent(input)).toEqual(input);
        expect(deserializeIntegrationEvent(serializeIntegrationEvent(parseIntegrationEvent(input)))).toEqual(input);
        expect(safeParseIntegrationEvent({ ...input, eventVersion: 2 })).toMatchObject({
          success: false, error: { code: "UNSUPPORTED_EVENT_VERSION" },
        });
      });
      for (const field of Object.keys(payloads[eventType])) {
        it(`requires ${field}`, () => {
          const data: Record<string, unknown> = { ...payloads[eventType] };
          delete data[field];
          invalidPayload(eventType, data);
        });
      }
      for (const field of ["orderId", "paymentId", "productId", "shipmentId"]) {
        if (field in payloads[eventType]) {
          it(`requires UUID ${field}`, () => {
            invalidPayload(eventType, { ...payloads[eventType], [field]: "invalid" });
          });
        }
      }
      for (const field of ["items", "reservations"]) {
        if (field in payloads[eventType]) {
          it.each([[], [{ productId: "invalid", quantity: 1 }],
            [{ productId, quantity: 0 }], [{ productId, quantity: -1 }],
            [{ productId, quantity: 1.5 }], [{ productId, quantity: "2" }],
            [{ productId, quantity: 2_147_483_648 }], [reservations[0], reservations[0]],
          ].map((value) => ({ value })))(`rejects invalid ${field}: %j`, ({ value }) => {
            invalidPayload(eventType, { ...payloads[eventType], [field]: value });
          });
        }
      }
      for (const field of ["amount", "totalAmount"]) {
        if (field in payloads[eventType]) {
          it.each([-1, 19.98, "-1.00", "1", "01.00", "1.001", "100000000.00", "NaN", "1e2"])(
            `rejects invalid ${field}: %s`, (value) => {
              invalidPayload(eventType, { ...payloads[eventType], [field]: value });
            });
          it("accepts zero and maximum money; rejects unsupported currency", () => {
            for (const value of ["0.00", "99999999.99"]) {
              expect(safeParseIntegrationEvent(event(eventType, { ...payloads[eventType], [field]: value })).success).toBe(true);
            }
            invalidPayload(eventType, { ...payloads[eventType], currency: "EUR" });
          });
        }
      }
      if ("userId" in payloads[eventType]) {
        it.each(["", "  ", 123])("rejects invalid user ID %s", (userId) => {
          invalidPayload(eventType, { ...payloads[eventType], userId });
        });
      }
    });
  }

  it.each([0, -1, 1.5, "2", 2_147_483_648])("rejects invalid failed reservation quantity %s", (quantity) => {
    invalidPayload("inventory.reservation_failed", { ...payloads["inventory.reservation_failed"], quantity });
  });
  it("uses business reasons, not exception strings", () => {
    invalidPayload("inventory.reservation_failed", { ...payloads["inventory.reservation_failed"], reason: "DB timeout" });
    expect(parseIntegrationEvent(event("inventory.reservation_failed", {
      ...payloads["inventory.reservation_failed"], reason: "PRODUCT_NOT_FOUND",
    })).data).toMatchObject({ reason: "PRODUCT_NOT_FOUND" });
    invalidPayload("payment.failed", { ...payment, failureCode: "card secret declined" });
    expect(parseIntegrationEvent(event("payment.failed", { ...payment, failureCode: null })).data)
      .toMatchObject({ failureCode: null });
  });

  it("ignores additive fields while validating known fields", () => {
    const input = event("inventory.reserved", {
      orderId, reservations: [{ ...reservations[0], futureOptional: true }], futureOptional: "v1 extension",
    });
    expect(parseIntegrationEvent({ ...input, futureOptional: true, producer: { ...input.producer, futureOptional: true } }))
      .toEqual({ ...input, data: payloads["inventory.reserved"] });
  });
  it("has unique names with schemas and positive explicit versions", () => {
    const names = integrationEventRegistry.map((schema) => schema.shape.eventType.value);
    expect(new Set(names).size).toBe(names.length);
    expect(names.sort()).toEqual(Object.keys(payloads).sort());
    for (const schema of integrationEventRegistry) {
      expect(schema.safeParse(event(schema.shape.eventType.value)).success).toBe(true);
      expect(schema.shape.eventVersion.value).toBe(1);
    }
  });
  it("narrows payload by eventType", () => {
    const parsed: KnownIntegrationEvent = parseIntegrationEvent(event("payment.succeeded"));
    if (parsed.eventType === "payment.succeeded") {
      expectTypeOf(parsed.data).toEqualTypeOf<PayloadFor<"payment.succeeded">>();
      expectTypeOf(parsed.data.amount).toEqualTypeOf<string>();
      expect(parsed.data.paymentId).toBe(payment.paymentId);
    } else throw new Error("Wrong event discriminator");
  });
});
