import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createIntegrationEvent, serializeIntegrationEvent } from "../events/boundary.js";
import { getCorrelation } from "../http/correlation.js";
import { ConflictError } from "../errors/httpErrors.js";
import { createLogger } from "../logging/logger.js";
import { checkoutMessageHandler, readCheckoutConfig } from "./checkout.js";

const logger = createLogger({ service: "checkout-test", environment: "test", level: "silent" });
const event = () => createIntegrationEvent({ eventType: "order.created", causationId: null, correlationId: randomUUID(), data: {
  orderId: randomUUID(), userId: "user", items: [{ productId: randomUUID(), quantity: 1 }], totalAmount: "10.00", currency: "USD",
} });

describe("checkout processing boundary", () => {
  it("maps envelope correlation and waits for confirmed publication", async () => {
    const input = event();
    let confirmed!: () => void;
    const publish = vi.fn(() => new Promise<void>((resolve) => { confirmed = resolve; }));
    const handler = vi.fn(async () => {
      expect(getCorrelation()?.traceId).toBe(input.correlationId);
      return input;
    });
    let complete = false;
    const work = checkoutMessageHandler(["order.created"], handler, publish, logger)(serializeIntegrationEvent(input)).then(() => { complete = true; });
    await vi.waitFor(() => expect(publish).toHaveBeenCalledOnce());
    expect(complete).toBe(false);
    confirmed();
    await work;
    expect(complete).toBe(true);
    expect(getCorrelation()).toBeUndefined();
  });
  it("retries transient DB/publish failures only three times", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("DB unavailable"));
    const publish = vi.fn();
    await expect(checkoutMessageHandler(["order.created"], handler, publish, logger)(serializeIntegrationEvent(event()))).rejects.toThrow("DB unavailable");
    expect(handler).toHaveBeenCalledTimes(3);
    expect(publish).not.toHaveBeenCalled();
    const input = event();
    const durableHandler = vi.fn(async () => input);
    const confirms = vi.fn().mockRejectedValueOnce(new Error("confirm unavailable")).mockResolvedValue(undefined);
    await checkoutMessageHandler(["order.created"], durableHandler, confirms, logger)(serializeIntegrationEvent(input));
    expect(durableHandler).toHaveBeenCalledTimes(2);
    expect(confirms.mock.calls[0]).toEqual(confirms.mock.calls[1]);
  });
  it("does not retry permanent conflicts or invoke handler on poison/unexpected events", async () => {
    const handler = vi.fn().mockRejectedValue(new ConflictError("mismatch"));
    await expect(checkoutMessageHandler(["order.created"], handler, vi.fn(), logger)(serializeIntegrationEvent(event()))).rejects.toThrow("mismatch");
    expect(handler).toHaveBeenCalledOnce();
    handler.mockClear();
    await expect(checkoutMessageHandler(["order.created"], handler, vi.fn(), logger)(Buffer.from("{"))).rejects.toThrow("MALFORMED_JSON");
    await expect(checkoutMessageHandler(["payment.succeeded"], handler, vi.fn(), logger)(serializeIntegrationEvent(event()))).rejects.toThrow("Unexpected checkout event type");
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("checkout configuration", () => {
  it("defaults off without needing broker credentials", () => expect(readCheckoutConfig({})).toEqual({ enabled: false, broker: undefined }));
  it("validates opt-in flag and required broker config", () => {
    expect(() => readCheckoutConfig({ EVENT_DRIVEN_CHECKOUT: "yes" })).toThrow();
    expect(() => readCheckoutConfig({ EVENT_DRIVEN_CHECKOUT: "true" })).toThrow();
    expect(readCheckoutConfig({ EVENT_DRIVEN_CHECKOUT: "true", RABBITMQ_URL: "amqp://localhost:5673" }).enabled).toBe(true);
  });
});
