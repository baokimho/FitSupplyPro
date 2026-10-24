import { context, propagation, trace, ROOT_CONTEXT, SpanKind, SpanStatusCode, type Attributes, type Span, type Context } from "@opentelemetry/api";
import { NodeTracerProvider, BatchSpanProcessor, ParentBasedSampler, TraceIdRatioBasedSampler, type SpanExporter } from "@opentelemetry/sdk-trace-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from "prom-client";
import type { Request, RequestHandler } from "express";
import { requireGatewaySecret } from "../middleware/internalGateway.middleware.js";

const services = new Set(["api-gateway", "dlq-operator", ...["auth", "catalog", "inventory", "cart", "order", "payment", "shipping", "notification"].map((s) => `${s}-service`)]);
const operations = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "proxy", "jwks", "fetch-jwks", "payment-snapshot", "confirm", "settle", "refund", "publish", "reconnect"]);
const eventOperations = new Set(["order.created", "order.confirmed", "order.cancelled", "order.processing_started", "inventory.reserved", "inventory.reservation_failed", "inventory.released", "inventory.release_failed", "payment.succeeded", "payment.failed", "payment.refunded", "payment.refund_failed", "checkout.payment_requested", "checkout.refund_requested"]);
const routeOverrides = new WeakMap<Request, string>();
export function proxyRoute(req: Request, targetService: string) { routeOverrides.set(req, services.has(targetService) ? `/${targetService}/*` : "proxy"); }
export function dependencyLabels(dependency: string, operation: string) {
  const verb = operation.split(" ", 1)[0];
  return { dependency: services.has(dependency) || ["checkout-handler", "payment-provider", "rabbitmq", "auth-jwks"].includes(dependency) ? dependency : "other",
    operation: operations.has(verb) ? verb : eventOperations.has(operation) ? operation : "other" };
}
const counters = {
  http_requests_total: ["method", "route", "status_code"],
  service_client_requests_total: ["dependency", "operation", "result"],
  service_client_errors_total: ["dependency", "operation", "error_class"],
  messages_published_total: ["event_type", "result"],
  messages_consumed_total: ["event_type", "queue", "result"],
  message_processing_failures_total: ["event_type", "queue", "error_class"],
  outbox_publish_total: ["event_type"], outbox_publish_failures_total: ["event_type"],
  inbox_duplicate_total: ["event_type"],
  retry_attempts_total: ["dependency", "operation", "error_class"],
  retry_exhausted_total: ["dependency", "operation", "error_class"],
  dlq_messages_total: ["queue", "error_class"], dlq_replays_total: ["queue"],
  dlq_replay_deliveries_total: ["queue"],
} as const;
const histograms = {
  http_request_duration_seconds: ["method", "route", "status_code"],
  service_client_request_duration_seconds: ["dependency", "operation", "result"],
  message_processing_duration_seconds: ["event_type", "queue", "result"],
  outbox_dispatch_duration_seconds: ["result"],
} as const;
type CounterName = keyof typeof counters;
type HistogramName = keyof typeof histograms;
type Labels = Record<string, string>;
type TelemetryState = { registry: Registry; counts: Map<string, Counter>; durations: Map<string, Histogram>; gauges: Map<string, Gauge>; collectors: Map<string, () => Promise<void>>; initialized: boolean; provider?: NodeTracerProvider };
const globalTelemetry = globalThis as typeof globalThis & { fitsupplyTelemetry?: TelemetryState };
const shared: TelemetryState = globalTelemetry.fitsupplyTelemetry ??= { registry: new Registry(), counts: new Map(), durations: new Map(), gauges: new Map(), collectors: new Map(), initialized: false };
const { registry, counts, durations, gauges, collectors } = shared;
let collecting: Promise<void> | undefined;
let service = "unknown";
let provider: NodeTracerProvider | undefined = shared.provider;
let pendingShutdown: Promise<void> | undefined;

/** One private registry per process; no global prom-client collectors. */
export function initializeTelemetry(name: string, exporter?: SpanExporter) {
  if (shared.initialized) return;
  shared.initialized = true;
  service = services.has(name) ? name : "unknown";
  registry.setDefaultLabels({ service });
  collectDefaultMetrics({ register: registry });
  for (const [metric, labels] of Object.entries(counters)) counts.set(metric, new Counter({ name: metric, help: metric, labelNames: [...labels], registers: [registry] }));
  for (const [metric, labels] of Object.entries(histograms)) durations.set(metric, new Histogram({ name: metric, help: metric, labelNames: [...labels], buckets: [0.005, 0.025, 0.1, 0.5, 1, 2.5, 5, 15, 30], registers: [registry] }));
  const endpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  // No backend configured: spans still propagate, with no exporter or background queue.
  const processors = [];
  if (exporter || endpoint) {
    try {
      const url = endpoint ? new URL(endpoint) : undefined;
      if (url && (!["http:", "https:"].includes(url.protocol) || url.username || url.password)) throw new Error("Invalid telemetry endpoint");
      processors.push(new BatchSpanProcessor(exporter ?? new OTLPTraceExporter({ url: url!.href, timeoutMillis: 1000 }), {
        maxQueueSize: 1024, maxExportBatchSize: 128, scheduledDelayMillis: 1000, exportTimeoutMillis: 1000,
      }));
    } catch { /* Telemetry configuration never gates service availability. */ }
  }
  const ratio = Number(process.env.OTEL_TRACES_SAMPLER_ARG ?? "1");
  provider = new NodeTracerProvider({ resource: resourceFromAttributes({ "service.name": service }),
    sampler: new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(Number.isFinite(ratio) && ratio >= 0 && ratio <= 1 ? ratio : 1) }),
    spanProcessors: processors, spanLimits: { attributeCountLimit: 16, attributeValueLengthLimit: 128, eventCountLimit: 8, linkCountLimit: 1 } });
  provider.register();
  shared.provider = provider;
}

export function count(name: CounterName, labels: Labels = {}) { counts.get(name)?.inc(labels); }
export function observe(name: HistogramName, seconds: number, labels: Labels = {}) { durations.get(name)?.observe(labels, seconds); }
export function setGauge(name: string, value: number, labelNames: string[] = [], labels: Labels = {}) {
  let gauge = gauges.get(name);
  if (!gauge) { gauge = new Gauge({ name, help: name, labelNames, registers: [registry] }); gauges.set(name, gauge); }
  gauge.set(labels, value);
}
export function registerTelemetryCollector(name: string, collect: () => Promise<void>) { collectors.set(name, collect); }
export async function telemetryMetrics() {
  if (!collecting) {
    collecting = Promise.all([...collectors.values()].map((collect) => collect())).then(() => undefined).finally(() => { collecting = undefined; });
  }
  let timer: NodeJS.Timeout | undefined;
  try {
    await Promise.race([collecting, new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error("Metrics collection unavailable")), 750); })]);
    return await registry.metrics();
  } finally { clearTimeout(timer); }
}
export function persistedCounter(name: string, value: number, labelNames: string[] = [], labels: Labels = {}) {
  let counter = counts.get(name);
  if (!counter) { counter = new Counter({ name, help: name, labelNames, registers: [registry] }); counts.set(name, counter); }
  counter.inc(labels, value);
}
export function resetPersistedCounter(name: string) { counts.get(name)?.reset(); }
export function activeTraceFields() {
  const current = trace.getSpan(context.active())?.spanContext();
  return current ? { otelTraceId: current.traceId, spanId: current.spanId } : {};
}
export function traceHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  propagation.inject(context.active(), headers);
  // Baggage is deliberately excluded: no arbitrary personal data propagation.
  return headers.traceparent ? { traceparent: headers.traceparent } : {};
}
export function extractTrace(headers: Record<string, unknown> = {}): Context {
  const value = headers.traceparent;
  return propagation.extract(ROOT_CONTEXT, typeof value === "string" && value.length <= 55 ? { traceparent: value } : {});
}
export function beginSpan(name: string, kind: SpanKind, attributes: Attributes = {}, parent = context.active(), linked?: Context) {
  const link = linked ? trace.getSpanContext(linked) : undefined;
  const span = trace.getTracer("fitsupply").startSpan(name, { kind, attributes, links: link ? [{ context: link }] : [] }, parent);
  return { span, context: trace.setSpan(parent, span) };
}
export function spanError(span: Span, errorClass = "failure") {
  span.setStatus({ code: SpanStatusCode.ERROR, message: errorClass });
  span.addEvent("exception", { "exception.type": errorClass, "exception.message": "Operation failed; inspect correlated service logs" });
}
export function recordSagaState(state: string) {
  if (["RESERVING", "PAYING", "CONFIRMING", "REFUNDING", "RELEASING", "COMPLETED", "CANCELLED", "COMPENSATED", "FAILED"].includes(state)) {
    trace.getSpan(context.active())?.addEvent("saga.state.staged", { "saga.state": state });
  }
}
export function activeSpanError(errorClass: string) { const span = trace.getSpan(context.active()); if (span) spanError(span, errorClass); }
export async function traced<T>(name: string, kind: SpanKind, attributes: Attributes, work: () => Promise<T>, parent = context.active(), linked?: Context): Promise<T> {
  const current = beginSpan(name, kind, attributes, parent, linked);
  return context.with(current.context, async () => {
    try { return await work(); } catch (error) { spanError(current.span); throw error; } finally { current.span.end(); }
  });
}
export { context as telemetryContext, ROOT_CONTEXT, SpanKind };

export function shutdownTelemetry(timeoutMs = 1000): Promise<void> {
  if (pendingShutdown) return pendingShutdown;
  pendingShutdown = (async () => {
    let timer: NodeJS.Timeout | undefined;
    try { await Promise.race([provider?.shutdown(), new Promise<void>((resolve) => { timer = setTimeout(resolve, timeoutMs); })]); }
    catch { /* Exporter failure cannot change shutdown result. */ }
    finally { clearTimeout(timer); }
  })();
  return pendingShutdown;
}
export async function flushTelemetry() { await provider?.forceFlush(); }

/** Never derive route labels from raw URL. Express patterns are application-owned. */
export function httpRoute(req: Request) {
  const override = routeOverrides.get(req); if (override) return override;
  const route: unknown = req.route?.path;
  return typeof route === "string" ? route : "unmatched";
}

export function telemetryHttp(name: string): RequestHandler {
  initializeTelemetry(name);
  return (req, res, next) => {
    if (req.path === "/metrics") {
      if (req.method !== "GET") { res.status(405).end(); return; }
      requireGatewaySecret(req, res, () => {
        void telemetryMetrics().then((body) => { res.type(registry.contentType).send(body); }, () => { res.status(503).end(); });
      });
      return;
    }
    const method = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].includes(req.method) ? req.method : "OTHER";
    const current = beginSpan("HTTP request", SpanKind.SERVER, { "http.request.method": method }, extractTrace(req.headers));
    const started = performance.now();
    let ended = false;
    const finish = () => {
      if (ended) return; ended = true;
      const labels = { method, route: httpRoute(req), status_code: String(res.writableFinished ? res.statusCode : 499) };
      count("http_requests_total", labels);
      observe("http_request_duration_seconds", (performance.now() - started) / 1000, labels);
      current.span.updateName(`${method} ${labels.route}`);
      current.span.setAttributes({ "http.route": labels.route, "http.response.status_code": Number(labels.status_code) });
      if (res.statusCode >= 500 || !res.writableFinished) spanError(current.span, "http_failure");
      current.span.end();
    };
    res.once("finish", finish); res.once("close", finish);
    context.with(current.context, next);
  };
}
