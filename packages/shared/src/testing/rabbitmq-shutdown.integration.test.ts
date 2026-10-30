import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { expect, it, vi } from "vitest";
import { createLogger } from "../logging/logger.js";
import { installShutdown } from "../http/shutdown.js";
import { readRabbitMqConfig } from "../messaging/config.js";
import { openRabbitMq } from "../messaging/broker.js";
import { checkoutMessageHandler } from "../messaging/checkout.js";
import { createIntegrationEvent, serializeIntegrationEvent } from "../events/boundary.js";
import { ServiceUnavailableError } from "../errors/httpErrors.js";

// Real shutdown aborts process dependency work permanently; isolate file and broker queues.
it("HTTP shutdown drains broker before DB cleanup, cancels retries and requeues incomplete delivery", async () => {
  const config = readRabbitMqConfig(); const endpoint = new URL(config.url);
  if (endpoint.hostname !== "localhost" || endpoint.port !== "5673" || endpoint.username !== "fitsupply_test" || endpoint.pathname) throw new Error("Requires disposable localhost:5673 broker");
  const logger = createLogger({ service: "shutdown-test", environment: "test", level: "silent" });
  const broker = await openRabbitMq(config, logger);
  const queue = `fitsupply.test.shutdown.${randomUUID()}`;
  const dlx = `${queue}.dlx`;
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const state = { stopping: false }; const cleanup: string[] = []; const exit = vi.fn();
  const shutdown = installShutdown({ server, logger, state, exit,
    cleanup: [async () => { await broker.close(); cleanup.push("broker"); }, () => { cleanup.push("database"); }],
  });
  try {
    const channel = await broker.createChannel(); await channel.assertExchange(dlx, "direct", { durable: true });
    await channel.assertQueue(`${queue}.dlq`, { durable: true });
    await channel.bindQueue(`${queue}.dlq`, dlx, queue);
    await channel.assertQueue(queue, { durable: true, deadLetterExchange: dlx, deadLetterRoutingKey: queue });
    const publisher = await broker.createPublisher();
    const event = createIntegrationEvent({ eventType: "order.created", correlationId: randomUUID(), causationId: null,
      data: { orderId: randomUUID(), userId: "user", items: [{ productId: randomUUID(), quantity: 1 }], totalAmount: "1.00", currency: "USD" } });
    const handler = vi.fn().mockRejectedValue(new ServiceUnavailableError("temporary database outage"));
    const process = checkoutMessageHandler(["order.created"], handler, async () => {}, logger, undefined,
      { policy: { maxAttempts: 3, baseDelayMs: 60000, maxDelayMs: 60000 } });
    await broker.subscribe(queue, (message) => process(message.content));
    await publisher.publish("", queue, serializeIntegrationEvent(event));
    await vi.waitFor(() => expect(handler).toHaveBeenCalledOnce());
    const pending = shutdown.shutdown("SIGTERM");
    expect(shutdown.shutdown("SIGINT")).toBe(pending);
    expect(state.stopping).toBe(true); await pending;
    expect(cleanup).toEqual(["broker", "database"]);
    expect(exit).toHaveBeenCalledExactlyOnceWith(0);
    expect(broker.isReady()).toBe(false); expect(handler).toHaveBeenCalledOnce();
    const inspector = await openRabbitMq(config, logger);
    try {
      const reader = await inspector.createChannel(); const message = await reader.get(queue, { noAck: true });
      if (!message) throw new Error("Shutdown lost unsettled delivery");
      expect(message.fields.redelivered).toBe(true);
      expect((await reader.checkQueue(`${queue}.dlq`)).messageCount).toBe(0);
    } finally { await inspector.close(); }
  } finally {
    shutdown.dispose(); server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve()));
    await broker.close();
    const inspector = await openRabbitMq(config, logger);
    try { const channel = await inspector.createChannel(); await channel.deleteQueue(queue); await channel.deleteQueue(`${queue}.dlq`); await channel.deleteExchange(dlx); }
    finally { await inspector.close(); }
  }
}, 10000);
