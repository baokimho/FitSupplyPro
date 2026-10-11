import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getCorrelation, runWithCorrelation } from "../http/correlation.js";
import {
  createIntegrationEvent, deserializeIntegrationEvent, IntegrationEventError,
  parseIntegrationEvent, safeParseIntegrationEvent, serializeIntegrationEvent,
} from "./boundary.js";

const draft = () => ({
  eventType: "order.created" as const, correlationId: randomUUID(), causationId: null,
  data: {
    orderId: randomUUID(), userId: "customer", totalAmount: "0.00", currency: "USD" as const,
    items: [{ productId: randomUUID(), quantity: 1 }],
  },
});

describe("integration serialization boundary", () => {
  it("round trips bytes/string with correlation and causation intact", () => {
    const event = createIntegrationEvent({ ...draft(), causationId: randomUUID() });
    const bytes = serializeIntegrationEvent(event);
    expect(Buffer.isBuffer(bytes)).toBe(true);
    expect(deserializeIntegrationEvent(bytes)).toEqual(event);
    expect(deserializeIntegrationEvent(bytes.toString("utf8"))).toEqual(event);
    expect(deserializeIntegrationEvent(new Uint8Array(bytes))).toEqual(event);
  });
  it.each(["", "{", "undefined", '{"data":NaN}', '\uFEFF{}'])("rejects malformed JSON %j", (json) => {
    expect(() => deserializeIntegrationEvent(json)).toThrow(expect.objectContaining({ code: "MALFORMED_JSON" }));
  });
  it("rejects malformed UTF-8 even in otherwise ignored future fields", () => {
    const bytes = Buffer.concat([Buffer.from('{"future":"'), Buffer.from([0xc3, 0x28]), Buffer.from('"}')]);
    expect(() => deserializeIntegrationEvent(bytes)).toThrow(expect.objectContaining({ code: "INVALID_UTF8" }));
  });
  it.each([null, [], {}, 5, "event"])("rejects decoded malformed envelope %j", (value) => {
    expect(() => deserializeIntegrationEvent(JSON.stringify(value))).toThrow(expect.objectContaining({ code: "INVALID_ENVELOPE" }));
  });
  it.each([
    [{ eventType: "future.happened" }, "UNKNOWN_EVENT_TYPE"],
    [{ eventType: "inventory.reserve" }, "UNKNOWN_EVENT_TYPE"],
    [{ eventVersion: 2 }, "UNSUPPORTED_EVENT_VERSION"],
    [{ eventVersion: "1" }, "INVALID_ENVELOPE"],
    [{ producer: { service: "payment-service" } }, "INVALID_ENVELOPE"],
    [{ data: { orderId: "wrong" } }, "INVALID_PAYLOAD"],
    [{ data: null }, "INVALID_ENVELOPE"],
    [{ correlationId: "wrong", eventType: "future.happened", eventVersion: 2 }, "INVALID_ENVELOPE"],
    [{ eventType: "future.happened", eventVersion: 2 }, "UNKNOWN_EVENT_TYPE"],
    [{ eventVersion: 2, data: {} }, "UNSUPPORTED_EVENT_VERSION"],
  ])("classifies contract failure %j", (changes, code) => {
    const input = { ...createIntegrationEvent(draft()), ...changes };
    expect(safeParseIntegrationEvent(input)).toMatchObject({ success: false, error: { code } });
    expect(() => parseIntegrationEvent(input)).toThrow(IntegrationEventError);
    expect(() => deserializeIntegrationEvent(JSON.stringify(input))).toThrow(expect.objectContaining({ code }));
  });
  it("validates output despite runtime mutation of typed event", () => {
    const event = createIntegrationEvent(draft());
    event.eventId = "invalid";
    expect(() => serializeIntegrationEvent(event)).toThrow(expect.objectContaining({ code: "INVALID_ENVELOPE" }));
    const valid = createIntegrationEvent(draft());
    if (valid.eventType === "order.created") valid.data.totalAmount = "invalid";
    expect(() => serializeIntegrationEvent(valid)).toThrow(expect.objectContaining({ code: "INVALID_PAYLOAD" }));
  });
  it("retains structured validation issues without exposing message in error text", () => {
    const result = safeParseIntegrationEvent({ ...createIntegrationEvent(draft()), data: { secret: "sensitive" } });
    if (result.success) throw new Error("Expected invalid payload");
    expect(result.error.issues.some((issue) => issue.path.includes("orderId"))).toBe(true);
    expect(result.error.message).not.toContain("sensitive");
  });
});

describe("creation metadata", () => {
  it("generates distinct event IDs, explicit version, owner and UTC occurrence", () => {
    const first = createIntegrationEvent(draft());
    const second = createIntegrationEvent(draft());
    expect(first.eventId).not.toBe(second.eventId);
    expect(first.eventVersion).toBe(1);
    expect(first.producer.service).toBe("order-service");
    expect(new Date(first.occurredAt).toISOString()).toBe(first.occurredAt);
    expect(first.causationId).toBeNull();
  });
  it("requires correlation outside HTTP and explicit direct cause", () => {
    const input = draft();
    expect(() => createIntegrationEvent({ ...input, correlationId: undefined }))
      .toThrow(expect.objectContaining({ code: "INVALID_ENVELOPE" }));
    expect(safeParseIntegrationEvent({ ...createIntegrationEvent(input), causationId: undefined }).success).toBe(false);
  });
  it("maps HTTP trace, not request ID, and preserves explicit workflow overrides", async () => {
    const traceId = randomUUID();
    const requestId = randomUUID();
    await runWithCorrelation({ traceId, requestId }, async () => {
      await Promise.resolve();
      const input = draft();
      const event = createIntegrationEvent({ ...input, correlationId: undefined });
      expect(event.correlationId).toBe(traceId);
      expect(event.correlationId).not.toBe(requestId);
      expect(event.causationId).toBeNull();
      expect(createIntegrationEvent(input).correlationId).toBe(input.correlationId);
    });
    expect(getCorrelation()).toBeUndefined();
  });
  it("carries upstream event ID as immediate cause", () => {
    const upstream = createIntegrationEvent(draft());
    const next = createIntegrationEvent({
      eventType: "inventory.reserved", correlationId: upstream.correlationId, causationId: upstream.eventId,
      data: { orderId: randomUUID(), reservations: [{ productId: randomUUID(), quantity: 2 }] },
    });
    expect(next.eventId).not.toBe(upstream.eventId);
    expect(deserializeIntegrationEvent(serializeIntegrationEvent(next))).toMatchObject({
      correlationId: upstream.correlationId, causationId: upstream.eventId,
    });
  });
});
