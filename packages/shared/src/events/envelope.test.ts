import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { integrationEventEnvelopeSchema } from "./envelope.js";

const envelope = () => ({
  eventId: randomUUID(), eventType: "order.created", eventVersion: 1,
  occurredAt: "2026-10-11T09:00:00.000Z", correlationId: randomUUID(),
  causationId: null, producer: { service: "order-service" }, data: {},
});

describe("canonical event envelope", () => {
  it("accepts UTC envelope and nullable or UUID cause", () => {
    const input = envelope();
    expect(integrationEventEnvelopeSchema.parse(input)).toEqual(input);
    expect(integrationEventEnvelopeSchema.safeParse({ ...envelope(), causationId: randomUUID() }).success).toBe(true);
  });

  it.each([
    ["eventId", "invalid"], ["eventId", "00000000-0000-0000-0000-000000000000"],
    ["correlationId", "invalid"], ["causationId", "request:123"], ["causationId", undefined],
    ["occurredAt", "yesterday"], ["occurredAt", "2026-02-30T12:00:00Z"],
    ["occurredAt", "2026-10-11T12:00:00+03:00"], ["occurredAt", "2026-10-11T12:00:00"],
    ["eventVersion", 0], ["eventVersion", -1], ["eventVersion", 1.5], ["eventVersion", "1"],
    ["eventType", "Order.Created"], ["eventType", "order"], ["eventType", "order.created.v1"],
    ["producer", undefined], ["producer", { service: "Order Service" }],
    ["data", undefined], ["data", null], ["data", []], ["data", "{}"],
  ])("rejects invalid %s = %s", (field, value) => {
    expect(integrationEventEnvelopeSchema.safeParse({ ...envelope(), [field]: value }).success).toBe(false);
  });
});
