import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import { EventEmitter, once } from "node:events";
import express from "express";
import request from "supertest";
import { afterAll, expect, it, vi } from "vitest";
import { InMemorySpanExporter } from "@opentelemetry/sdk-trace-node";
import type { Channel, ConsumeMessage } from "amqplib";
import { initializeTelemetry, telemetryMetrics, traced, SpanKind, traceHeaders, activeTraceFields, flushTelemetry, shutdownTelemetry, dependencyLabels } from "./telemetry.js";
import { createLogger } from "../logging/logger.js";
import { httpLogger } from "../logging/http.js";
import { correlationMiddleware } from "../http/correlation.js";
import { fetchDependency } from "../resilience/timeout.js";
import { retryOperation } from "../resilience/retry.js";
import { DependencyError } from "../resilience/failure.js";
import { createIntegrationEvent, serializeIntegrationEvent } from "../events/boundary.js";
import { enqueueOutboxEvent, dispatchOutboxOnce, type OutboxTransaction } from "../messaging/outbox.js";
import { consumeRabbitMq } from "../messaging/consumer.js";
import { createCheckoutDeliveryHandler } from "../messaging/checkout.js";
import { replayDlqDelivery } from "../messaging/dlq.js";

const exporter = new InMemorySpanExporter();
initializeTelemetry("order-service", exporter);
const logs: string[] = [];
const logger = createLogger({ service: "order-service", environment: "test" }, { write: (line: string) => { logs.push(line); } });
const parent = "00-0123456789abcdef0123456789abcdef-0123456789abcdef-01";
const app = express();
app.use(correlationMiddleware("service"), httpLogger(logger));
app.get("/orders/:id", (_req, res) => { logger.info("inside handler"); res.status(201).json(activeTraceFields()); });
app.get("/failed/:id", (_req, res) => { res.status(503).end(); });
afterAll(async () => { await shutdownTelemetry(); });

it("counts completed HTTP results using route patterns, never IDs or queries", async () => {
  const labels = { method: "GET", route: "/orders/:id", status_code: "201", service: "order-service" };
  const before = counterValue(await telemetryMetrics(), "http_requests_total", labels);
  for (const id of [randomUUID(), randomUUID()]) await request(app).get(`/orders/${id}?password=secret`).set("traceparent", parent).expect(201);
  await request(app).get("/failed/unique-value").expect(503);
  await request(app).get("/unknown/arbitrary-secret").expect(404);
  const metrics = await telemetryMetrics();
  expect(counterValue(metrics, "http_requests_total", labels) - before).toBe(2);
  expect(metrics).toContain('route="/failed/:id",status_code="503"');
  expect(metrics).toContain('route="unmatched",status_code="404"');
  expect(metrics).not.toMatch(/unique-value|arbitrary-secret|password|email|requestId|traceId/);
  await flushTelemetry();
  expect(exporter.getFinishedSpans().find((span) => span.name === "GET /failed/:id")?.status.code).toBe(2);
});

it("keeps UUID correlation separate from W3C trace/span IDs in logs", async () => {
  const response = await request(app).get("/orders/log-test").set("traceparent", parent).expect(201);
  expect(response.body.otelTraceId).toBe("0123456789abcdef0123456789abcdef");
  const line = logs.map((line) => JSON.parse(line) as Record<string, unknown>).findLast((line) => line.msg === "inside handler");
  expect(line).toMatchObject(response.body);
  expect(line?.requestId).toMatch(/^[0-9a-f-]{36}$/);
  expect(line?.traceId).toMatch(/^[0-9a-f-]{36}$/);
  expect(line?.spanId).toMatch(/^[0-9a-f]{16}$/);
});

it("protects metrics, rejects other methods and registers collectors once", async () => {
  vi.stubEnv("GATEWAY_SECRET", "metrics-test-secret");
  await request(app).get("/metrics").expect(403);
  await request(app).post("/metrics").expect(405);
  initializeTelemetry("order-service");
  const response = await request(app).get("/metrics").set("x-internal-secret", "metrics-test-secret").expect(200);
  expect(response.text).toContain("process_cpu_user_seconds_total");
  expect(response.text.match(/# HELP http_requests_total/g)).toHaveLength(1);
  expect(response.text).not.toContain("metrics-test-secret");
  vi.unstubAllEnvs();
});
it("rejects malformed trace context and shares collectors across module reload", async () => {
  const response = await request(app).get("/orders/context").set("traceparent", "password=never-export").set("baggage", "email=private@example.com").expect(201);
  expect(response.body.otelTraceId).toMatch(/^[0-9a-f]{32}$/);
  vi.resetModules();
  const reloaded = await import("./telemetry.js");
  reloaded.initializeTelemetry("order-service");
  const metrics = await reloaded.telemetryMetrics();
  expect(metrics.match(/# HELP http_requests_total/g)).toHaveLength(1);
  expect(metrics).not.toContain("never-export");
});

it("propagates parent -> client -> downstream HTTP span without forwarding baggage", async () => {
  const downstream = express();
  downstream.use(correlationMiddleware("service"), httpLogger(logger));
  downstream.get("/inventory/:id", (req, res) => { expect(req.headers.baggage).toBeUndefined(); res.json(activeTraceFields()); });
  const server = createServer(downstream); server.listen(0, "127.0.0.1"); await once(server, "listening");
  try {
    const address = server.address(); if (!address || typeof address === "string") throw new Error("No address");
    let origin: ReturnType<typeof activeTraceFields> = {};
    const output = await traced("checkout test", SpanKind.INTERNAL, {}, async () => {
      origin = activeTraceFields();
      return fetchDependency(`http://127.0.0.1:${address.port}/inventory/${randomUUID()}`, undefined,
        { dependency: "inventory-service", operation: "GET /inventory/unbounded-id", safe: true, timeoutMs: 1000 });
    });
    expect(JSON.parse(output.text).otelTraceId).toBe(origin.otelTraceId);
    await flushTelemetry();
    const spans = exporter.getFinishedSpans().filter((span) => span.spanContext().traceId === origin.otelTraceId);
    const client = spans.find((span) => span.name === "dependency request");
    const received = spans.find((span) => span.name === "GET /inventory/:id");
    expect(client?.parentSpanContext?.spanId).toBe(origin.spanId);
    expect(received?.parentSpanContext?.spanId).toBe(client?.spanContext().spanId);
  } finally { await close(server); }
});

const event = () => createIntegrationEvent({ eventType: "order.confirmed", correlationId: randomUUID(), causationId: null, data: { orderId: randomUUID(), userId: "private-user" } });

it("persists original Outbox trace context and links a later dispatch span", async () => {
  const input = event();
  let stored: { payload: string; traceparent?: string } = { payload: "" };
  const tx: OutboxTransaction = {
    $queryRaw: vi.fn().mockImplementation(async () => [{ id: "row", ...stored, attempts: 0 }]),
    outboxEvent: { findUnique: async () => null, upsert: async (args) => { stored = args.create; return stored; }, update: async () => ({}) },
  };
  let origin: ReturnType<typeof activeTraceFields> = {};
  await traced("original request", SpanKind.INTERNAL, {}, async () => { origin = activeTraceFields(); await enqueueOutboxEvent(tx, input); });
  expect(stored.traceparent).toContain(origin.otelTraceId);
  expect(JSON.parse(stored.payload)).not.toHaveProperty("traceparent");
  let publishedTrace: ReturnType<typeof activeTraceFields> = {};
  await dispatchOutboxOnce({ $transaction: async (work) => work(tx) }, async () => { publishedTrace = activeTraceFields(); }, logger);
  await flushTelemetry();
  const dispatch = exporter.getFinishedSpans().findLast((span) => span.name === "outbox dispatch");
  expect(dispatch?.parentSpanContext).toBeUndefined();
  expect(dispatch?.links[0].context).toMatchObject({ traceId: origin.otelTraceId, spanId: origin.spanId });
  expect(publishedTrace.otelTraceId).toBe(dispatch?.spanContext().traceId);
  expect(publishedTrace.otelTraceId).not.toBe(origin.otelTraceId);
});

it("extracts RabbitMQ context and records failed processing without payload data", async () => {
  let deliver!: (message: ConsumeMessage | null) => void;
  const channel = Object.assign(new EventEmitter(), { prefetch: vi.fn(), consume: vi.fn(async (_queue, callback) => { deliver = callback; return { consumerTag: "test" }; }),
    ack: vi.fn(), nack: vi.fn(), cancel: vi.fn(), close: vi.fn() }) as unknown as Channel;
  const received: Array<ReturnType<typeof activeTraceFields>> = [];
  const consumer = await consumeRabbitMq(channel, "order.payment-events", async () => { received.push(activeTraceFields()); throw new Error("password=NEVER-EXPORT"); }, logger);
  deliver({ content: serializeIntegrationEvent(event()), fields: { routingKey: "order.confirmed", redelivered: false, consumerTag: "test", deliveryTag: 1, exchange: "domain.events" }, properties: { headers: { traceparent: parent, "x-fitsupply-replay-count": 1 } } } as unknown as ConsumeMessage);
  await vi.waitFor(() => expect(channel.nack).toHaveBeenCalled());
  await consumer.stop(); await flushTelemetry();
  expect(received[0].otelTraceId).toBe("0123456789abcdef0123456789abcdef");
  const span = exporter.getFinishedSpans().findLast((span) => span.name === "rabbitmq consume");
  expect(span?.status.code).toBe(2);
  expect(JSON.stringify({ attributes: span?.attributes, events: span?.events })).not.toMatch(/NEVER-EXPORT|private-user/);
  expect(await telemetryMetrics()).toContain('error_class="PERMANENT"');
  expect(await telemetryMetrics()).toContain('dlq_replay_deliveries_total{queue="order.payment-events",service="order-service"} 1');
});
it("keeps dispatch span open through marker commit and marks commit failure", async () => {
  const input = event();
  const tx: OutboxTransaction = { $queryRaw: vi.fn().mockResolvedValue([{ id: "row", payload: serializeIntegrationEvent(input).toString("utf8"), attempts: 0 }]),
    outboxEvent: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() } };
  await expect(dispatchOutboxOnce({ $transaction: async (work) => { await work(tx); throw new Error("private DB credentials"); } }, async () => {}, logger)).rejects.toThrow("private DB credentials");
  await flushTelemetry();
  const span = exporter.getFinishedSpans().findLast((span) => span.name === "outbox dispatch");
  expect(span?.status.code).toBe(2);
  expect(span?.attributes["dispatch.result"]).toBe("transaction_failure");
  expect(JSON.stringify(span?.events)).not.toContain("private DB credentials");
});

it("observes duplicates separately, confirmed quarantine and replay without changing settlement", async () => {
  const input = event();
  const delivery = createCheckoutDeliveryHandler("order.payment-events", ["order.confirmed"], async () => null, async () => {}, logger,
    { $transaction: async (work) => work({ $queryRaw: vi.fn(), checkoutEvent: { findUnique: async () => ({ fingerprint: (await import("../messaging/checkout.js")).checkoutEventFingerprint(input) }) } }) });
  const message = { content: serializeIntegrationEvent(input), fields: { routingKey: input.eventType, deliveryTag: 1 }, properties: { headers: {} } } as ConsumeMessage;
  await delivery.handle(message);
  const before = await telemetryMetrics();
  expect(before).toContain('inbox_duplicate_total{event_type="order.confirmed",service="order-service"} 1');
  await delivery.quarantine(message, new Error("private failure"), async () => {});
  expect(await telemetryMetrics()).toContain('dlq_messages_total{queue="order.payment-events",error_class="PERMANENT",service="order-service"} 1');
  const replayMessage = { ...message, content: serializeIntegrationEvent(createIntegrationEvent({ eventType: "payment.refunded", correlationId: randomUUID(), causationId: null, data: { orderId: randomUUID(), paymentId: randomUUID(), amount: "1.00", currency: "USD" } })) };
  const ack = vi.fn();
  await replayDlqDelivery({ ack }, "order.payment-events.dlq", replayMessage, async () => {});
  expect(ack).toHaveBeenCalledOnce();
  expect(await telemetryMetrics()).toContain('dlq_replays_total{queue="order.payment-events",service="order-service"} 1');
});

it("counts only eligible retries/exhaustion and bounds dynamic operation labels", async () => {
  await expect(retryOperation(async () => { throw new DependencyError("inventory-service", "reserve", "transient", true); },
    { dependency: "inventory-service", operation: `POST /inventory/${randomUUID()}`, safe: true, maxAttempts: 2, baseDelayMs: 1, maxDelayMs: 1, logger })).rejects.toThrow();
  const metrics = await telemetryMetrics();
  expect(metrics).toContain('retry_attempts_total{dependency="inventory-service",operation="POST",error_class="transient",service="order-service"} 1');
  expect(metrics).toContain('retry_exhausted_total{dependency="inventory-service",operation="POST",error_class="transient",service="order-service"} 1');
  expect(dependencyLabels("user@example.com", "order.arbitrary_attacker_name")).toEqual({ dependency: "other", operation: "other" });
  expect(traceHeaders()).toEqual({});
});

async function close(server: Server) { server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())); }

function counterValue(metrics: string, name: string, labels: Record<string, string>) {
  const line = metrics.split("\n").find((line) => line.startsWith(`${name}{`) && Object.entries(labels).every(([key, value]) => line.includes(`${key}="${value}"`)));
  return Number(line?.split(" ").at(-1) ?? 0);
}
