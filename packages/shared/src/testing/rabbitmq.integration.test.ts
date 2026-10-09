import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { Channel, GetMessage } from "amqplib";
import { createLogger } from "../logging/logger.js";
import { getCorrelation, runWithCorrelation } from "../http/correlation.js";
import { installShutdown } from "../http/shutdown.js";
import { readRabbitMqConfig } from "../messaging/config.js";
import { openRabbitMq } from "../messaging/broker.js";
import { DEAD_LETTER_EXCHANGE, DOMAIN_EXCHANGE, DOMAIN_QUEUES, declareRabbitMqTopology } from "../messaging/topology.js";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

describe("real RabbitMQ mechanics", () => {
  let broker: Awaited<ReturnType<typeof openRabbitMq>>;
  let channel: Channel;
  let publisher: Awaited<ReturnType<typeof broker.createPublisher>>;
  let logs: string[];
  let expectedCloseFailure: boolean;

  beforeEach(async () => {
    const config = readRabbitMqConfig();
    const url = new URL(config.url);
    // Tests purge only the disposable broker; never development queues.
    if (url.hostname !== "localhost" || url.port !== "5673" || url.username !== "fitsupply_test" || url.pathname) {
      throw new Error("RabbitMQ tests require disposable localhost:5673 with fitsupply_test user and default vhost");
    }
    logs = [];
    expectedCloseFailure = false;
    const logger = createLogger({ service: "rabbitmq-test", environment: "test", level: "debug" }, {
      write(line: string) { logs.push(line); },
    });
    broker = await openRabbitMq(config, logger);
    channel = await broker.createChannel();
    await declareRabbitMqTopology(channel);
    for (const queue of DOMAIN_QUEUES) {
      await channel.purgeQueue(queue.name);
      await channel.purgeQueue(`${queue.name}.dlq`);
    }
    publisher = await broker.createPublisher();
  });

  afterEach(async () => {
    if (!broker) return;
    if (expectedCloseFailure) await expect(broker.close()).rejects.toThrow("Consumer drain timed out");
    else await broker.close();
  });

  async function receive(queue: string): Promise<GetMessage> {
    let message: GetMessage | false = false;
    await vi.waitFor(async () => {
      message = await channel.get(queue, { noAck: false });
      expect(message).not.toBe(false);
    }, { timeout: 2000, interval: 20 });
    if (!message) throw new Error("Message missing");
    return message;
  }

  it("connects, declares both exchanges and all queues repeatedly without incompatibility", async () => {
    expect(broker.isReady()).toBe(true);
    await declareRabbitMqTopology(channel);
    await channel.checkExchange(DOMAIN_EXCHANGE);
    await channel.checkExchange(DEAD_LETTER_EXCHANGE);
    for (const queue of DOMAIN_QUEUES) {
      expect((await channel.checkQueue(queue.name)).messageCount).toBe(0);
      expect((await channel.checkQueue(`${queue.name}.dlq`)).messageCount).toBe(0);
    }
    await channel.close();
    channel = await broker.createChannel();
    await declareRabbitMqTopology(channel);
  });

  it.each(DOMAIN_QUEUES.flatMap((queue) => queue.bindings.map((key) => ({ queue: queue.name, key }))))(
    "confirms and routes $key to $queue", async ({ queue, key }) => {
      await publisher.publish(DOMAIN_EXCHANGE, key, Buffer.from("broker mechanics"));
      const message = await receive(queue);
      expect(message.content.toString()).toBe("broker mechanics");
      expect(message.fields.exchange).toBe(DOMAIN_EXCHANGE);
      expect(message.fields.routingKey).toBe(key);
      expect(message.properties.deliveryMode).toBe(2);
      channel.ack(message);
      expect(logs.some((line) => JSON.parse(line).msg === "broker publish confirmed")).toBe(true);
    },
  );

  it("does not route unrelated keys to another service queue", async () => {
    await publisher.publish(DOMAIN_EXCHANGE, "payment.succeeded", Buffer.from("payment"));
    expect(await channel.get("inventory.order-created", { noAck: true })).toBe(false);
    expect(await channel.get("payment.inventory-reserved", { noAck: true })).toBe(false);
    expect(await channel.get("notification.order-events", { noAck: true })).toBe(false);
    channel.ack(await receive("order.payment-events"));
  });

  it("ACKs only after processing succeeds, then successful message stays removed", async () => {
    const started = deferred();
    const release = deferred();
    const consumer = await broker.subscribe("inventory.order-created", async () => {
      started.resolve();
      await release.promise;
    }, 1);
    await publisher.publish(DOMAIN_EXCHANGE, "order.created", Buffer.from("success"));
    await started.promise;
    expect(logs.some((line) => JSON.parse(line).msg === "broker message acknowledged")).toBe(false);
    release.resolve();
    await consumer.stop();
    expect((await channel.checkQueue("inventory.order-created")).messageCount).toBe(0);
    expect(await channel.get("inventory.order-created", { noAck: true })).toBe(false);
    expect(logs.some((line) => JSON.parse(line).msg === "broker message acknowledged")).toBe(true);
  });

  it.each(DOMAIN_QUEUES)("NACK without requeue dead-letters $name to its own DLQ", async (queue) => {
    let attempts = 0;
    const consumer = await broker.subscribe(queue.name, async () => {
      attempts++;
      throw new Error("demo processing failure");
    });
    await publisher.publish(DOMAIN_EXCHANGE, queue.bindings[0], Buffer.from("poison"));
    const dead = await receive(`${queue.name}.dlq`);
    expect(dead.content.toString()).toBe("poison");
    expect(dead.fields.exchange).toBe(DEAD_LETTER_EXCHANGE);
    expect(dead.fields.routingKey).toBe(queue.name);
    expect(dead.properties.headers?.["x-death"]).toEqual(expect.arrayContaining([
      expect.objectContaining({ queue: queue.name, reason: "rejected", count: 1 }),
    ]));
    channel.ack(dead);
    await consumer.stop();
    expect(attempts).toBe(1);
    expect((await channel.checkQueue(queue.name)).messageCount).toBe(0);
  });

  it("NACK with requeue returns delivery marked redelivered", async () => {
    await publisher.publish(DOMAIN_EXCHANGE, "order.created", Buffer.from("retry demo"));
    const first = await receive("inventory.order-created");
    expect(first.fields.redelivered).toBe(false);
    channel.nack(first, false, true);
    const second = await receive("inventory.order-created");
    expect(second.fields.redelivered).toBe(true);
    channel.ack(second);
    expect(await channel.get("inventory.order-created", { noAck: true })).toBe(false);
  });

  it("prefetch bounds in-flight processing until ACK releases capacity", async () => {
    const release = deferred();
    let received = 0;
    let active = 0;
    let maxActive = 0;
    const consumer = await broker.subscribe("inventory.order-created", async () => {
      received++;
      active++;
      maxActive = Math.max(maxActive, active);
      await release.promise;
      active--;
    }, 1);
    await Promise.all([1, 2, 3].map((n) => publisher.publish(DOMAIN_EXCHANGE, "order.created", Buffer.from(String(n)))));
    await vi.waitFor(() => expect(received).toBe(1));
    expect((await channel.checkQueue("inventory.order-created")).messageCount).toBe(2);
    release.resolve();
    await vi.waitFor(() => expect(received).toBe(3));
    await consumer.stop();
    expect(maxActive).toBe(1);
  });

  it("surfaces unroutable returns despite positive broker confirmation", async () => {
    await expect(publisher.publish(DOMAIN_EXCHANGE, "unbound.demo", Buffer.from("unrouted")))
      .rejects.toThrow("Broker returned unroutable message");
    await publisher.publish(DOMAIN_EXCHANGE, "order.created", Buffer.from("next"));
    channel.ack(await receive("inventory.order-created"));
  });

  it("surfaces a real negative publisher confirm when queue rejects overflow", async () => {
    const { queue } = await channel.assertQueue("", {
      durable: false, exclusive: true, autoDelete: true,
      arguments: { "x-max-length": 0, "x-overflow": "reject-publish" },
    });
    await channel.bindQueue(queue, DOMAIN_EXCHANGE, "demo.rejected");
    await expect(publisher.publish(DOMAIN_EXCHANGE, "demo.rejected", Buffer.from("overflow"))).rejects.toThrow();
    expect((await channel.checkQueue(queue)).messageCount).toBe(0);
    await publisher.publish(DOMAIN_EXCHANGE, "order.created", Buffer.from("next succeeds"));
    channel.ack(await receive("inventory.order-created"));
  });

  it("surfaces publisher channel failure for missing exchange", async () => {
    await expect(publisher.publish(`missing.${randomUUID()}`, "demo", Buffer.from("failure"))).rejects.toThrow();
    await expect(publisher.publish(DOMAIN_EXCHANGE, "order.created", Buffer.from("after close"))).rejects.toThrow();
    expect(logs.some((line) => JSON.parse(line).msg === "broker channel error")).toBe(true);
  });

  it("fails connection startup explicitly, with broker logs", async () => {
    const logger = createLogger({ service: "rabbitmq-test", environment: "test" }, {
      write(line: string) { logs.push(line); },
    });
    await expect(openRabbitMq({ url: "amqp://localhost:1", connectionTimeoutMs: 100 }, logger)).rejects.toThrow();
    expect(logs.some((line) => JSON.parse(line).msg === "broker connection failed")).toBe(true);
  });

  it("incompatible topology closes only offending channel and surfaces failure", async () => {
    const incompatible = await broker.createChannel();
    await expect(incompatible.assertExchange(DOMAIN_EXCHANGE, "fanout", { durable: true })).rejects.toThrow();
    expect(broker.isReady()).toBe(true);
    await publisher.publish(DOMAIN_EXCHANGE, "order.created", Buffer.from("still available"));
    channel.ack(await receive("inventory.order-created"));
  });

  it("preserves correlation in headers and isolates concurrent consumer contexts", async () => {
    const contexts = [1, 2].map(() => ({ requestId: randomUUID(), traceId: randomUUID() }));
    const observed: unknown[] = [];
    const consumer = await broker.subscribe("inventory.order-created", async (message) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      observed.push(getCorrelation());
      expect(message.properties.headers?.["x-trace-id"]).toBe(getCorrelation()?.traceId);
    }, 2);
    await Promise.all(contexts.map((context) => runWithCorrelation(context, () =>
      publisher.publish(DOMAIN_EXCHANGE, "order.created", Buffer.from("correlation")))));
    await vi.waitFor(() => expect(observed).toHaveLength(2));
    await consumer.stop();
    expect(observed).toEqual(expect.arrayContaining(contexts));
    expect(getCorrelation()).toBeUndefined();
    const acknowledged = logs.map((line) => JSON.parse(line)).filter((entry) => entry.msg === "broker message acknowledged");
    expect(acknowledged.map((entry) => entry.traceId)).toEqual(expect.arrayContaining(contexts.map((entry) => entry.traceId)));
  });

  it("closes channels/connection exactly once and rejects new work", async () => {
    const closed = vi.fn();
    channel.on("close", closed);
    const first = broker.close();
    expect(broker.close()).toBe(first);
    expect(broker.isReady()).toBe(false);
    await first;
    expect(closed).toHaveBeenCalledTimes(1);
    await expect(channel.checkExchange(DOMAIN_EXCHANGE)).rejects.toThrow();
    await expect(broker.createChannel()).rejects.toThrow("Broker unavailable or shutting down");
    await expect(publisher.publish(DOMAIN_EXCHANGE, "order.created", Buffer.from("late"))).rejects.toThrow();
  });

  it("shutdown waits for in-flight handler before closing connection", async () => {
    const started = deferred();
    const release = deferred();
    await broker.subscribe("inventory.order-created", async () => { started.resolve(); await release.promise; });
    await publisher.publish(DOMAIN_EXCHANGE, "order.created", Buffer.from("drain"));
    await started.promise;
    let closed = false;
    const closing = broker.close().then(() => { closed = true; });
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(closed).toBe(false);
    release.resolve();
    await closing;
    expect(closed).toBe(true);
  });

  it("shutdown settles an in-flight confirmed publish before closing publisher", async () => {
    const pending = publisher.publish(DOMAIN_EXCHANGE, "order.created", Buffer.from("publish drain"));
    // Allow serialized publish to start before shutdown stops new work.
    await Promise.resolve();
    await broker.close();
    await expect(pending).resolves.toBeUndefined();
    expect(logs.some((line) => JSON.parse(line).msg === "broker publish confirmed")).toBe(true);
  });

  it("existing HTTP shutdown hook drains broker before DB cleanup and handles duplicate signals", async () => {
    const logger = createLogger({ service: "shutdown-test", environment: "test", level: "silent" });
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const state = { stopping: false };
    const cleanup: string[] = [];
    const exit = vi.fn();
    const shutdown = installShutdown({ server, logger, state, exit,
      cleanup: [async () => { await broker.close(); cleanup.push("broker"); }, () => { cleanup.push("database"); }],
    });
    const pending = shutdown.shutdown("SIGTERM");
    expect(shutdown.shutdown("SIGINT")).toBe(pending);
    expect(state.stopping).toBe(true);
    await pending;
    expect(cleanup).toEqual(["broker", "database"]);
    expect(exit).toHaveBeenCalledExactlyOnceWith(0);
    expect(broker.isReady()).toBe(false);
  });

  it("bounded drain closes channel, requeues unsettled work and prevents late ACK", async () => {
    const started = deferred();
    const release = deferred();
    const consumer = await broker.subscribe("inventory.order-created", async () => { started.resolve(); await release.promise; });
    await publisher.publish(DOMAIN_EXCHANGE, "order.created", Buffer.from("timeout"));
    await started.promise;
    await expect(consumer.stop()).rejects.toThrow("Consumer drain timed out");
    const redelivered = await receive("inventory.order-created");
    expect(redelivered.fields.redelivered).toBe(true);
    channel.ack(redelivered);
    release.resolve();
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(logs.some((line) => JSON.parse(line).msg === "broker message acknowledged")).toBe(false);
    expectedCloseFailure = true;
    await expect(broker.close()).rejects.toThrow("Consumer drain timed out");
    expect(broker.isReady()).toBe(false);
  });
});
