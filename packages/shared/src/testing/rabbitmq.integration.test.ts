import { randomUUID } from "node:crypto";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { Channel, GetMessage } from "amqplib";
import { createLogger } from "../logging/logger.js";
import { getCorrelation, runWithCorrelation } from "../http/correlation.js";
import { readRabbitMqConfig } from "../messaging/config.js";
import { openRabbitMq } from "../messaging/broker.js";
import { DEAD_LETTER_EXCHANGE, DOMAIN_EXCHANGE, DOMAIN_QUEUES, declareRabbitMqTopology } from "../messaging/topology.js";
import { checkoutMessageHandler } from "../messaging/checkout.js";
import { createIntegrationEvent } from "../events/boundary.js";
import { inspectDlq, replayDlq, replayDlqDelivery } from "../messaging/dlq.js";
import { serializeIntegrationEvent } from "../events/boundary.js";
import { traced, SpanKind, traceHeaders, activeTraceFields, telemetryMetrics } from "../observability/telemetry.js";

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

  const recoveryQueue = "inventory.order-created";
  const recoveryDlq = `${recoveryQueue}.dlq`;
  const recoveryEvent = () => createIntegrationEvent({ eventType: "order.cancelled", correlationId: randomUUID(), causationId: null,
    data: { orderId: randomUUID(), userId: "user", items: [{ productId: randomUUID(), quantity: 1 }] } });
  it("real confirmed publish carries W3C producer context into consumer span", async () => {
    let origin: ReturnType<typeof activeTraceFields> = {};
    let received: ReturnType<typeof activeTraceFields> | undefined;
    let headers: Record<string, unknown> | undefined;
    await broker.subscribe(recoveryQueue, async (message) => { received = activeTraceFields(); headers = message.properties.headers; });
    await traced("real producer request", SpanKind.INTERNAL, {}, async () => {
      origin = activeTraceFields();
      expect(traceHeaders().traceparent).toContain(origin.otelTraceId);
      await publisher.publish(DOMAIN_EXCHANGE, "order.cancelled", serializeIntegrationEvent(recoveryEvent()));
    });
    await vi.waitFor(() => expect(received).toBeDefined());
    expect(received?.otelTraceId).toBe(origin.otelTraceId);
    expect(received?.spanId).not.toBe(origin.spanId);
    expect(headers?.traceparent).toContain(origin.otelTraceId);
    expect(await telemetryMetrics()).toContain('messages_published_total{event_type="order.cancelled",result="confirmed"');
  });
  it("bounded DLQ inspection holds copies unacknowledged and does not expose payloads", async () => {
    for (let i = 0; i < 3; i++) await publisher.publish(DEAD_LETTER_EXCHANGE, recoveryQueue, Buffer.from(`password=secret-${i}`));
    const records = await inspectDlq(broker, recoveryDlq, 2);
    expect(records).toHaveLength(2);
    expect(JSON.stringify(records)).not.toContain("secret");
    expect(records.every((record) => !record.replayEligible)).toBe(true);
    expect((await channel.checkQueue(recoveryDlq)).messageCount).toBe(3);
    await expect(inspectDlq(broker, recoveryDlq, 101)).rejects.toThrow("1..100");
  });
  it("confirmed replay preserves bytes and identity, targets only source queue, then removes DLQ copy", async () => {
    const event = recoveryEvent(); const bytes = serializeIntegrationEvent(event);
    await publisher.publish(DEAD_LETTER_EXCHANGE, recoveryQueue, bytes);
    const [record] = await inspectDlq(broker, recoveryDlq);
    await expect(replayDlq(broker, recoveryDlq, record.id, "wrong")).rejects.toThrow("matching");
    expect((await channel.checkQueue(recoveryDlq)).messageCount).toBe(1);
    await replayDlq(broker, recoveryDlq, record.id, record.id);
    const replayed = await receive(recoveryQueue);
    expect(replayed.content).toEqual(bytes);
    expect(replayed.fields.exchange).toBe("");
    expect(replayed.properties.headers).toMatchObject({ "x-fitsupply-replay-count": 1, "x-trace-id": event.correlationId });
    channel.ack(replayed);
    expect((await channel.checkQueue(recoveryDlq)).messageCount).toBe(0);
    expect((await channel.checkQueue("notification.order-events")).messageCount).toBe(0);
  });
  it("mandatory replay publication failure retains original DLQ message", async () => {
    const bytes = serializeIntegrationEvent(recoveryEvent());
    await publisher.publish(DEAD_LETTER_EXCHANGE, recoveryQueue, bytes);
    const [record] = await inspectDlq(broker, recoveryDlq);
    await channel.deleteQueue(recoveryQueue);
    await expect(replayDlq(broker, recoveryDlq, record.id, record.id)).rejects.toThrow("unroutable");
    expect((await inspectDlq(broker, recoveryDlq))[0].id).toBe(record.id);
    await declareRabbitMqTopology(channel);
  });
  it.each(["lost-confirmation", "shutdown"])("%s before DLQ ACK retains source even when replay may already exist", async (mode) => {
    const bytes = serializeIntegrationEvent(recoveryEvent());
    await publisher.publish(DEAD_LETTER_EXCHANGE, recoveryQueue, bytes);
    const message = await receive(recoveryDlq);
    const controller = new AbortController();
    await expect(replayDlqDelivery(channel, recoveryDlq, message, async (...args) => {
      await publisher.publish(...args);
      if (mode === "shutdown") controller.abort(new DOMException("Operator shutdown", "AbortError"));
      else throw new Error("Confirmation response lost");
    }, controller.signal)).rejects.toThrow();
    await channel.close(); channel = await broker.createChannel();
    expect((await inspectDlq(broker, recoveryDlq))).toHaveLength(1);
    const replayed = await receive(recoveryQueue);
    expect(replayed.content).toEqual(bytes);
    channel.ack(replayed);
  });
  it("operator replay count cap quarantines repeated failures without automatic draining", async () => {
    const bytes = serializeIntegrationEvent(recoveryEvent());
    await publisher.publish(DEAD_LETTER_EXCHANGE, recoveryQueue, bytes, { "x-fitsupply-replay-count": 3 });
    const [record] = await inspectDlq(broker, recoveryDlq);
    expect(record).toMatchObject({ replayCount: 3, replayEligible: false, event: { eventType: "order.cancelled" } });
    await expect(replayDlq(broker, recoveryDlq, record.id, record.id)).rejects.toThrow("Replay limit");
    expect((await channel.checkQueue(recoveryDlq)).messageCount).toBe(1);
  });

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

  it.each(["json", "envelope", "version", "payload", "unexpected"])("dead-letters checkout %s contract violations before business work", async (kind) => {
    const input = createIntegrationEvent({ eventType: "order.created", correlationId: randomUUID(), causationId: null, data: {
      orderId: randomUUID(), userId: "user", items: [{ productId: randomUUID(), quantity: 1 }], totalAmount: "1.00", currency: "USD",
    } });
    const payload = kind === "json" ? "{" : JSON.stringify(kind === "envelope" ? {} : kind === "version" ? { ...input, eventVersion: 2 } :
      kind === "payload" ? { ...input, data: {} } : input);
    const handler = vi.fn(async () => null);
    const logger = createLogger({ service: "checkout-test", environment: "test", level: "silent" });
    const process = checkoutMessageHandler(kind === "unexpected" ? ["payment.failed"] : ["order.created"], handler, async () => undefined, logger);
    const consumer = await broker.subscribe("inventory.order-created", (message) => process(message.content));
    await publisher.publish(DOMAIN_EXCHANGE, "order.created", Buffer.from(payload));
    const dead = await receive("inventory.order-created.dlq");
    expect(dead.properties.headers?.["x-death"]).toEqual(expect.arrayContaining([expect.objectContaining({ queue: "inventory.order-created", reason: "rejected", count: 1 })]));
    channel.ack(dead);
    expect(handler).not.toHaveBeenCalled();
    await consumer.stop();
  });

  it("critical publisher/consumer channel loss makes readiness false", async () => {
    const consumer = await broker.subscribe("inventory.order-created", async () => undefined);
    expect(broker.isReady()).toBe(true);
    await consumer.stop();
    expect(broker.isReady()).toBe(false);
  });
  it("permanent compensation error publishes failure fact and still dead-letters source", async () => {
    const input = createIntegrationEvent({ eventType: "order.cancelled", correlationId: randomUUID(), causationId: randomUUID(), data: {
      orderId: randomUUID(), userId: "user", items: [{ productId: randomUUID(), quantity: 1 }],
    } });
    const logger = createLogger({ service: "test", environment: "test", level: "silent" });
    const { ConflictError } = await import("../errors/httpErrors.js");
    const process = checkoutMessageHandler(["order.cancelled"], async () => { throw new ConflictError("release blocked"); },
      (event) => publisher.publish(DOMAIN_EXCHANGE, event.eventType, Buffer.from(JSON.stringify(event))), logger,
      async (event, _error, retryable) => createIntegrationEvent({ eventType: "inventory.release_failed", correlationId: event.correlationId, causationId: event.eventId,
        data: { orderId: event.data.orderId, failureCode: "RELEASE_FAILED", retryable } }));
    await broker.subscribe("inventory.order-created", (message) => process(message.content));
    await publisher.publish(DOMAIN_EXCHANGE, "order.cancelled", Buffer.from(JSON.stringify(input)));
    channel.ack(await receive("inventory.order-created.dlq"));
    const diagnosis = await receive("order.payment-events");
    expect(JSON.parse(diagnosis.content.toString())).toMatchObject({ eventType: "inventory.release_failed", data: { retryable: false } });
    channel.ack(diagnosis);
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
    const overlap = deferred();
    let entered = 0;
    const consumer = await broker.subscribe("inventory.order-created", async (message) => {
      if (++entered === 2) overlap.resolve();
      await overlap.promise;
      observed.push(getCorrelation());
      expect(message.properties.headers?.["x-trace-id"]).toBe(getCorrelation()?.traceId);
    }, 2);
    await Promise.all(contexts.map((context) => runWithCorrelation(context, () =>
      publisher.publish(DOMAIN_EXCHANGE, "order.created", Buffer.from("correlation")))));
    try { await vi.waitFor(() => expect(observed).toHaveLength(2)); }
    finally { overlap.resolve(); await consumer.stop(); }
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
    await vi.waitFor(async () => expect((await channel.checkQueue("inventory.order-created")).consumerCount).toBe(0));
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

  it("shutdown allows accepted consumers to confirm output before ACK while rejecting new publications", async () => {
    const started = deferred();
    const release = deferred();
    const inspector = await openRabbitMq(readRabbitMqConfig(), createLogger({ service: "test", environment: "test", level: "silent" }));
    const reader = await inspector.createChannel();
    try {
      await broker.subscribe("inventory.order-created", async () => {
        started.resolve();
        await release.promise;
        await publisher.publish(DOMAIN_EXCHANGE, "checkout.payment_requested", Buffer.from("durable outcome"));
      });
      await publisher.publish(DOMAIN_EXCHANGE, "order.created", Buffer.from("accepted"));
      await started.promise;
      const closing = broker.close();
      await expect(publisher.publish(DOMAIN_EXCHANGE, "order.created", Buffer.from("new work"))).rejects.toThrow("shutting down");
      release.resolve();
      await closing;
      const message = await reader.get("payment.inventory-reserved", { noAck: true });
      if (!message) throw new Error("Required output lost during drain");
      expect(message.content.toString()).toBe("durable outcome");
      expect(logs.some((line) => JSON.parse(line).msg === "broker message acknowledged")).toBe(true);
    } finally { release.resolve(); await inspector.close(); }
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
    // Protocol round trip yields after released handler resumes; no arbitrary sleep.
    await channel.checkQueue("inventory.order-created");
    expect(logs.some((line) => JSON.parse(line).msg === "broker message acknowledged")).toBe(false);
    expectedCloseFailure = true;
    await expect(broker.close()).rejects.toThrow("Consumer drain timed out");
    expect(broker.isReady()).toBe(false);
  });
});
