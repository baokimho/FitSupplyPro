# Phase 15 observability

## Pre-change audit (2026-10-24)

Gateway, Auth, Catalog, Inventory, Order, Payment and Shipping already use shared Pino logging, UUID request/correlation IDs, AsyncLocalStorage, HTTP completion timing, bounded readiness checks and shutdown. RabbitMQ propagates UUID correlation headers; checkout restores correlation from its canonical envelope. Dependency deadlines/retries, confirmed publishing, transactional Outbox, Inbox receipts, durable delivery budgets and manual DLQ replay already exist. None provide Prometheus metrics or distributed spans.

Cart and Notification retain older console HTTP logs and startup wiring. They need shared telemetry entry points too. Notification has no live checkout consumer. Existing UUID `traceId` is a workflow correlation ID, not a W3C trace identifier. Outbox currently persists only canonical event bytes, so transport-only tracing headers would be lost across restart. Business counters must come from committed state, never transaction callbacks that may roll back.

## Architecture and access

Shared manual OpenTelemetry instrumentation uses its Node AsyncLocalStorage context manager and W3C trace-context propagator. A process-wide singleton owns the SDK and a private Prometheus registry, including Node/process runtime collectors. Module reload and repeated app factories reuse collectors. All nine HTTP services use these entry points; Cart, Shipping and Notification now also use shared HTTP correlation/logging and bounded shutdown.

`GET /metrics` requires existing `x-internal-secret: GATEWAY_SECRET` authorization. Scrape each service directly on its private network. Gateway rejects proxied service `/metrics` paths, including public Auth. Metrics requests themselves are excluded from request instrumentation. Normal probes remain observable. No telemetry dependency participates in readiness.

Set `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` in each service environment to an OTLP HTTP/JSON endpoint, for example `http://collector:4318/v1/traces`. Development Compose reads per-service env files; a root `.env` value alone does not configure every container. Empty endpoint disables export while retaining spans/context propagation. `OTEL_TRACES_SAMPLER_ARG` sets root sampling ratio from 0 to 1 (default 1); parent sampling decisions remain authoritative. Only W3C `traceparent` crosses boundaries; baggage and tracestate are deliberately omitted. No collector deployment is required for application operation.

## Request and event flow

```text
Client traceparent
  -> Gateway SERVER -> proxy CLIENT
      -> Order SERVER -> dependency CLIENT -> Inventory/Payment SERVER
              |
              +-- DB transaction: domain state + Outbox(payload, traceparent)
                                    |
                later/restart        | span LINK to original context
                                    v
                       Outbox PRODUCER (new trace)
                          -> RabbitMQ PRODUCER -> CONSUMER
                             -> retry attempt -> Inbox/domain/Outbox transaction
                                      |                    |
                                      +-> confirmed DLQ    +-> next linked dispatch
                                          -> manual replay
```

## Metrics and ownership

All application metrics carry fixed `service` label. Histograms use seconds and buckets 0.005, 0.025, 0.1, 0.5, 1, 2.5, 5, 15 and 30, plus infinity.

| Family | Meaning / additional labels |
| --- | --- |
| `http_requests_total`, `http_request_duration_seconds` | Completed inbound request: method, application route pattern, status_code. Abandoned responses use 499. |
| `service_client_requests_total`, `service_client_request_duration_seconds` | Each dependency transport attempt, including gateway proxy: dependency, operation, result. A retry is another attempt. |
| `service_client_errors_total` | Failed attempt: dependency, operation, error_class. HTTP 4xx/5xx responses classified separately from transport errors. |
| `messages_published_total` | Confirmed or failed publisher attempt: event_type, result. Confirms do not imply consumer completion. |
| `messages_consumed_total`, `message_processing_duration_seconds` | Accepted broker delivery processing: event_type, queue, result (`success`, `failure`, `cancelled`, `quarantined`, `quarantine_failed`). |
| `message_processing_failures_total` | One consumer processing-failure counter, event_type/queue/error_class. Inbox processing failures use this same boundary; shutdown cancellation is separate. |
| `outbox_publish_total`, `outbox_publish_failures_total` | Confirmed/failed Outbox publish attempts by event_type. A lost marker commit can cause another confirmed attempt. |
| `outbox_dispatch_duration_seconds` | Entire dispatch transaction including lock/publication/marker commit; result includes publication or transaction failure. Empty polls are successful dispatch calls. |
| `outbox_pending_total` | Gauge of **all persisted unpublished rows**, including delayed retries and locked rows. |
| `outbox_oldest_pending_age_seconds` | Age of oldest persisted unpublished row, zero when empty. |
| `inbox_processed_total` | Persisted committed Inbox receipts by event_type. Duplicates/rolled-back transactions create no additional receipt. |
| `inbox_duplicate_total` | Operational observations of already committed, fingerprint-matching deliveries. Distinct from processing failure. |
| `retry_attempts_total` | Eligible additional retry scheduled, by dependency/operation/error_class. Initial attempts excluded. |
| `retry_exhausted_total` | Observed short retry-limit or durable delivery-budget exhaustion. Redelivery can observe an already exhausted budget again; metric never governs budget. |
| `dlq_messages_total` | Application quarantine publications confirmed by broker, queue/error_class (`POISON`, `PERMANENT`, `TRANSIENT`). Native legacy NACK-to-DLX is not a confirmed application publication. |
| `dlq_replays_total` | Confirmed operator replay followed by local ACK, queue. CLI registry is process-local; its counter is not a durable operator audit log. |
| `dlq_replay_deliveries_total` | Replayed deliveries observed by long-running source consumers, queue. Exposed on service metrics; broker redelivery of a replay counts another processing attempt. Distinct from operator publication count. |
| `business_events_committed_total` | Persisted unique Outbox intents by event_type: async reservation, payment, refund, confirmation and cancellation outcomes. Never counts dispatch/redelivery copies. |
| `orders_created_total`, `payments_created_total`, `inventory_operations_committed_total` | Persisted row counts, covering synchronous and asynchronous paths. Idempotent replay cannot create another row. |
| `checkout_sagas` | Gauge of committed Saga rows by bounded state, including compensation and failure states. |
| `process_*`, `nodejs_*` | Standard runtime/resource measurements. |

Persisted counters are reconstructed at scrape time from retained rows. They survive service restart and never count staged/rolled-back work. Their monotonicity assumes current retention policy (no deletion of domain/Outbox/Inbox ledgers). Database resets or future ledger pruning reset these series. Aggregate identical database-backed series with `max`, not `sum`, across replicas sharing one database. Operational attempt counters are process-local and reset on restart; Prometheus `rate` handles these resets.

Collection is single-flight and bounded to 750 ms at HTTP boundary. A database error/slow collection returns metrics 503 rather than falsely reporting zero backlog. Existing database deadlines bound remaining driver work. No polling collector runs inside business transactions. At current scale SQL aggregates favor correctness and minimal implementation; retained-ledger scans grow with ledger size.

## Cardinality audit

Metric dimensions originate from application constants, not payloads. HTTP methods use seven known methods plus OTHER. Routes use Express patterns, gateway's fixed target-service prefix, or `unmatched`; arbitrary 404 paths never become labels. Outbound operations containing URLs collapse to their HTTP verb. Other operations use fixed allowlists, including canonical checkout event types, with `other` fallback. Event labels use registered event types or `unknown`; consumer queues come from fixed topology (generic consumers use `other`). Failures use fixed classifications. Saga states come from enum allowlist.

No labels contain user/order/event/operation/request/trace IDs, email, raw URL, exception text or secrets. Histograms add only bounded bucket labels; process collectors add bounded runtime metadata. Gateway prefix aggregation deliberately sacrifices endpoint detail at edge; owning service supplies precise route pattern.

## Tracing and logging semantics

* `requestId`: existing UUID for an individual request/hop, returned as `x-request-id`; new outgoing hop gets fresh UUID.
* `traceId`: existing UUID workflow correlation, carried as `x-trace-id` / canonical event correlationId. Gateway continues owning this UUID.
* `otelTraceId`: standard 32-hex distributed trace ID, independently extracted/generated through W3C context.
* `spanId`: 16-hex ID of active operation within OTel trace. Pino ALS mixin adds `otelTraceId`/`spanId` alongside existing UUID fields; HTTP completion captures original server context explicitly.

Inbound HTTP spans preserve valid W3C parent context; malformed context starts a new trace. Gateway reconstructs outbound tracing separately from verified identity headers; incoming tracing never grants authority. Dependency client spans include bounded operation/service/status and existing timeout behavior. Server 5xx/abandonment, failed client responses and exceptions mark relevant spans as errors. Exception events contain fixed sanitized summaries/classes, never raw exception messages, stack, URLs, tokens, bodies or personal data.

RabbitMQ producer spans inject their own context into transport headers; consumer spans extract it independently of UUID envelope correlation. Each delivery and short retry attempt has its own span. Queue/event/result attributes describe processing without payload data. Confirm/ACK/NACK/drain ordering is unchanged. Quarantine and replay publications also receive producer spans.

Outbox stores nullable `traceparent` alongside unchanged canonical payload, in the existing business transaction. Replays retain first stored metadata. Dispatch starts a **new root trace with a span link** to saved context: original request/consumer may have finished or process restarted. Broker publish and consumer spans are children in this new trace. Next Outbox dispatch links onward. Follow span links plus unchanged UUID correlation to traverse entire Saga; it intentionally is not one indefinitely open HTTP trace. Old rows without context dispatch normally as independent roots.

Saga spans expose event type and staged state events: RESERVING, PAYING, CONFIRMING, COMPLETED and REFUNDING/RELEASING/COMPENSATED/CANCELLED/FAILED. `saga.state.staged` describes transaction work, not a committed business counter; transaction failure marks enclosing span as failed. Database gauges and existing durable Saga state remain authority. No state-machine transition or compensation policy changed.

## Failure and shutdown behavior

Dependency failures preserve sanitized responses, deadlines and retry eligibility. Each layer measures its own boundary: gateway/client/server metrics describe different operations and must not be summed as unique logical failures. Unknown/poison events receive bounded labels. Consumer errors mark failed spans, then existing policy retries or quarantines. Committed duplicates retain distinct metrics; durable budgets remain authoritative. Manual replay still requires selected message plus matching confirmation; canonical bytes, confirm-before-ACK and replay cap remain intact.

Exporter work runs on bounded batch queue (1024 spans, batches 128, 1-second schedule/export deadline). Backend outage drops/fails telemetry without awaiting export on application paths. Invalid endpoint configuration disables exporter rather than application. No telemetry backend affects readiness or business correctness. Sampling/queue overflow/export loss mean tracing is diagnostic, not an accounting ledger.

Existing shutdown stops new work, cancels dependency work, drains HTTP/messages/publishers and closes application resources. It then shuts down SDK/exporters with an additional **maximum one second**, inside existing eight-second process deadline. Export failures/timeouts do not turn successful shutdown into failure. Cart/Shipping/Notification now close Prisma/pool through same shutdown path. DLQ operator also flushes/closes telemetry within one second after broker shutdown.

Apply the three additive Outbox migrations before deploying new binaries. Existing code tolerates nullable new column; new dispatcher requires it. No canonical event schema, sync default, async flag, idempotency, DLQ replay or trusted identity contract changed.

## Verification

Tests exercise normalized routes/statuses, runtime metrics and internal access, repeated initialization/module reload, UUID/OTel log correlation, real HTTP parent-child propagation, RabbitMQ propagation, persisted Outbox links, committed counts versus duplicate/rollback, delayed backlog age, retries/exhaustion, duplicates/quarantine/replay, actual OTLP HTTP export with sanitized errors, backend outage and bounded shutdown. Async success and decline E2E flows inspect persisted and transported trace context at every event stage.

Final matrix results are recorded in `TESTING.md`.
