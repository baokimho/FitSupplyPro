import { describe, expect, it, vi } from "vitest";
import type { Channel } from "amqplib";
import { consumeRabbitMq } from "./consumer.js";
import { createLogger } from "../logging/logger.js";
import { getCorrelation, runWithCorrelation } from "../http/correlation.js";
import { randomUUID } from "node:crypto";

describe("consumer local validation/context", () => {
  it.each([0, -1, 1.5, 65536, NaN])("rejects invalid prefetch %s before broker I/O", async (prefetch) => {
    const channel = { prefetch: vi.fn() };
    const logger = createLogger({ service: "test", environment: "test", level: "silent" });
    await expect(consumeRabbitMq(channel as unknown as Channel, "queue", async () => undefined, logger, prefetch))
      .rejects.toThrow("Consumer prefetch must be an integer from 1 to 65535");
    expect(channel.prefetch).not.toHaveBeenCalled();
  });
  it("copies and freezes correlation while preserving asynchronous context", async () => {
    const context = { requestId: randomUUID(), traceId: randomUUID() };
    await runWithCorrelation(context, async () => {
      context.traceId = randomUUID();
      await Promise.resolve();
      expect(getCorrelation()?.traceId).not.toBe(context.traceId);
      expect(Object.isFrozen(getCorrelation())).toBe(true);
    });
    expect(getCorrelation()).toBeUndefined();
  });
});
