import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createIntegrationEvent, DeliveryPoisonError } from "@shared/utils";
import { buildNotification, defaultEmailPolicy, deliveryFailureState, deliveryIdentity, emailFailure, EmailProviderError } from "./notification.js";
import { loadConfig } from "../config/env.js";

const metadata = () => ({ correlationId: randomUUID(), causationId: null });
describe("notification content", () => {
  it.each(["order.confirmed", "order.cancelled"] as const)("maps %s without exposing event payload", (eventType) => {
    const orderId = randomUUID();
    const event = eventType === "order.confirmed"
      ? createIntegrationEvent({ eventType, ...metadata(), data: { orderId, userId: "owner" } })
      : createIntegrationEvent({ eventType, ...metadata(), data: { orderId, userId: "owner", items: [{ productId: randomUUID(), quantity: 1 }] } });
    const result = buildNotification(event);
    expect(result).toEqual({ userId: "owner", type: eventType === "order.confirmed" ? "ORDER_CONFIRMED" : "ORDER_CANCELLED",
      title: eventType === "order.confirmed" ? "Order confirmed" : "Order cancelled",
      message: `Order ${orderId} has been ${eventType === "order.confirmed" ? "confirmed" : "cancelled"}.` });
  });
  it("rejects unsupported recipient-free payment facts", () => {
    const event = createIntegrationEvent({ eventType: "payment.failed", ...metadata(), data: {
      orderId: randomUUID(), paymentId: randomUUID(), amount: "10.00", currency: "USD", failureCode: "DECLINED",
    } });
    expect(() => buildNotification(event)).toThrow(DeliveryPoisonError);
  });
  it.each(["shipment.shipped", "shipment.delivered"] as const)("maps real %s fulfillment fact", (eventType) => {
    const shipmentId = randomUUID();
    const result = buildNotification(createIntegrationEvent({ eventType, ...metadata(), data: { orderId: randomUUID(), shipmentId, userId: "owner" } }));
    expect(result).toEqual({ userId: "owner", type: eventType === "shipment.shipped" ? "ORDER_SHIPPED" : "ORDER_DELIVERED",
      title: eventType === "shipment.shipped" ? "Order shipped" : "Order delivered",
      message: eventType === "shipment.shipped" ? `Shipment ${shipmentId} has shipped.` : `Shipment ${shipmentId} has been delivered.` });
  });
});

describe("email retry policy", () => {
  it("keeps one provider identity across retries", () => {
    expect(deliveryIdentity("record-1")).toBe("delivery:record-1");
    expect(deliveryIdentity("record-1")).not.toBe(deliveryIdentity("record-2"));
  });
  it.each(["TRANSIENT", "TIMEOUT", "PERMANENT"] as const)("classifies %s with fixed safe diagnostics", (code) => {
    expect(emailFailure(new EmailProviderError(code))).toEqual({ retryable: code !== "PERMANENT", summary: `EMAIL_${code}` });
  });
  it("discards arbitrary provider secret text and attached payload", () => {
    const error = Object.assign(new Error("Bearer private-token smtp://user:password@host sensitive email"), { body: "private" });
    expect(emailFailure(error)).toEqual({ retryable: true, summary: "EMAIL_UNKNOWN" });
  });
  it("schedules bounded exponential backoff with deterministic injected jitter", () => {
    expect(deliveryFailureState(new EmailProviderError("TRANSIENT"), 1, defaultEmailPolicy, 1000, () => 0))
      .toEqual({ status: "PENDING", lastError: "EMAIL_TRANSIENT", nextAttemptAt: new Date(1500) });
    expect(deliveryFailureState(new Error(), 2, defaultEmailPolicy, 1000, () => 1).nextAttemptAt).toEqual(new Date(3000));
    const policy = { ...defaultEmailPolicy, maxAttempts: 5, maxDelayMs: 1200 };
    expect(deliveryFailureState(new Error(), 4, policy, 1000, () => 1).nextAttemptAt).toEqual(new Date(2200));
  });
  it("exhausted and permanent failures are terminal", () => {
    expect(deliveryFailureState(new EmailProviderError("TRANSIENT"), 3, defaultEmailPolicy, 1000).status).toBe("FAILED");
    expect(deliveryFailureState(new EmailProviderError("PERMANENT"), 1, defaultEmailPolicy, 1000).status).toBe("FAILED");
  });
});

describe("notification startup config", () => {
  const env = { GATEWAY_SECRET: "test-secret", RABBITMQ_URL: "amqp://localhost:5673" };
  it("always consumes independently of checkout feature flag", () => {
    expect(loadConfig({ ...env, EVENT_DRIVEN_CHECKOUT: "false" })).toMatchObject({ port: 3008, emailPolicy: { maxAttempts: 3 } });
    expect(loadConfig({ ...env, EMAIL_MAX_ATTEMPTS: "5" }).emailPolicy.maxAttempts).toBe(5);
  });
  it.each(["0", "6", "", "1.5", "03"])("rejects invalid email budget %s", (EMAIL_MAX_ATTEMPTS) => {
    expect(() => loadConfig({ ...env, EMAIL_MAX_ATTEMPTS })).toThrow("EMAIL_MAX_ATTEMPTS");
  });
  it("rejects missing dependencies and unsupported providers without leaking values", () => {
    expect(() => loadConfig({ ...env, EMAIL_PROVIDER: "smtp://private" })).toThrow("EMAIL_PROVIDER must be fake");
    expect(() => loadConfig({ ...env, GATEWAY_SECRET: undefined })).toThrow("GATEWAY_SECRET");
    expect(() => loadConfig({ ...env, RABBITMQ_URL: undefined })).toThrow("RABBITMQ_URL");
  });
});
