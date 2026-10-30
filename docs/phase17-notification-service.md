# Phase 17 — Notification Service

This records Phase 17 baseline. Phase 19 replaces Shipping's legacy HTTP intake
with real `shipment.shipped` / `shipment.delivered` producers and extends existing
Notification queue/templates. See [Shipping service](phase19-shipping-service.md).

## Before Phase 17

Notification had one Prisma `Notification` model: user, legacy type, title/message,
read-state and timestamps. Shared gateway-secret middleware protected internal
`POST /internal/notifications`; existing customer APIs were
`GET /notifications/me`, `PATCH /notifications/:id/read`, and
`PATCH /notifications/read-all`. Phase 16 covered intake authentication and
owner isolation with two PostgreSQL/API tests.

Order awaited best-effort HTTP notifications on synchronous creation and HTTP
cancellation. Payment had no direct Notification call. Shipping still sends
`ORDER_SHIPPED` / `ORDER_DELIVERED` through internal HTTP. Notification had no
provider, email worker, Inbox, delivery persistence or RabbitMQ consumer.
Startup connected PostgreSQL; shutdown closed HTTP/DB through shared lifecycle
helpers. Health reported process availability without a dependency readiness
check. Phase 15 already supplied HTTP correlation, logs, metrics, tracing and
bounded telemetry shutdown.

Shared topology already owned `notification.order-events`, bound to
`order.confirmed` and `order.cancelled`, with the standard DLX/DLQ. Existing
broker, consumer, event registry, retry policy, durable `ConsumerDelivery` and
`CheckoutEvent` Inbox patterns provide acceptance mechanics. These are reused.

## Architecture and supported events

```text
Order / Payment outcomes
          |
    Order lifecycle + Outbox
          |
     domain.events
          | order.confirmed / order.cancelled
          v
 notification.order-events
          |
 Notification consumer
          |
   DB transaction
   +-------------------------------+
   | CheckoutEvent (Inbox receipt)  |
   | Notification                  |
   | NotificationDelivery=PENDING  |
   +-------------------------------+
          |
        COMMIT
          |
         ACK

 Notification DB
          |
 Email delivery worker
          |
    claim + bounded send
          |
     EmailProvider
       /       \
     SENT    retry PENDING
                 |
               FAILED
```

Only existing V1 contracts with real producers and recipient identity are
subscribed. `order.confirmed` maps to `ORDER_CONFIRMED`; `order.cancelled` maps to
`ORDER_CANCELLED`. Content generation is separate from broker handling.
`payment.failed` has no user identity in its contract. Its existing Saga
cancellation produces `order.cancelled`, so failed async checkout receives a
cancellation notification without a new cross-service lookup or altered event.
No shipment events or speculative contracts were added.

Queue: `notification.order-events`; topic exchange: `domain.events`; bindings:
`order.confirmed`, `order.cancelled`. Quarantine uses `domain.events.dlx` and
`notification.order-events.dlq`, including existing selected-message operator
inspection/replay, replay cap, confirmed quarantine publication and trace headers.
Other services retain their own queues.

## Producer and legacy HTTP changes

Order no longer calls Notification over HTTP. Creation-only `ORDER_CREATED`
in-app records are retired: outbound lifecycle email starts at confirmation or
cancellation. HTTP lifecycle commands atomically update Order and enqueue the
existing canonical fact. Saga processing retains its existing transactional
Inbox/Outbox and event generation; no second event is added to that path.

Synchronous Order starts only an Outbox publisher when `RABBITMQ_URL` is
configured; it does not start Saga consumers. Broker unavailability leaves
durable intents pending and does not gate synchronous HTTP readiness. Missing
broker configuration likewise leaves intents pending until configured. Async
checkout keeps its existing broker readiness and startup requirements.
Synchronous checkout remains default; async checkout remains opt-in.

Shipping has no real integration-event producers. Its separate shipped/delivered
legacy HTTP intake remains an in-app record only, with no email delivery row.
Existing customer read APIs and authenticated internal intake remain compatible;
no new notification-center endpoints were introduced. This is not a duplicate
email path. Payment does not call Notification. Existing unused Payment
deployment URL configuration is not an active notification path.

## Persistence and Inbox

`Notification` retains legacy fields and adds nullable unique `sourceEventId`,
`correlationId`, `traceparent` and delivery relation. Nullable source identity
keeps old rows valid. `NotificationDelivery` holds channel (`EMAIL` only), status,
persisted attempt count, due time, claim token/expiry, provider message ID, safe
failure code and timestamps. A unique `(notificationId, channel)` prevents a
second delivery for one logical channel.

Shared `processInboxEvent` uses the same transaction-scoped advisory lock,
canonical fingerprint and receipt shape as checkout consumers. Notification
supplies business effects inside that transaction. Concurrent duplicates wait,
then observe the committed receipt. Same ID/different canonical content is a
conflict. Notification, delivery and receipt either commit together or all roll
back. `ConsumerDelivery` is the separate committed operational attempt ledger,
not an acceptance receipt. Naming follows existing persistence conventions.

ACK occurs only after the handler transaction resolves. No email is sent by the
broker consumer. No Notification Outbox exists: a DB-polled delivery row already
provides durable intent for email. An Outbox would be needed if Notification
later atomically publishes an integration event, which this phase does not do.

## Email worker and concurrency

1. Short transaction selects one due `PENDING` row using
   `FOR UPDATE SKIP LOCKED`, increments attempt count, assigns a unique token and
   expiry, commits `SENDING`.
2. Sender transaction locks that `SENDING` row with matching token, again using
   `SKIP LOCKED`. It holds only the delivery row during the bounded provider call.
3. Success records `SENT`, provider ID and `sentAt`; classified failure records
   delayed `PENDING` or final `FAILED`. Completion commits before releasing lock.

The committed attempt survives process death. Recovery locks one expired
`SENDING` row with `SKIP LOCKED`, preserves consumed attempts, clears the claim
and schedules delayed retry or marks exhaustion `FAILED`. An actively locked
send cannot be reclaimed even after lease expiry. Matching tokens fence delayed
former owners after recovery. Restart needs no process memory or manual reset.

Defaults: 3 attempts, configurable `EMAIL_MAX_ATTEMPTS` 1–5; exponential jitter
with 1000 ms base and 30000 ms cap; provider deadline 2000 ms; abandoned claim
expiry 10000 ms; idle polling 500 ms. Stale recovery schedules at least 1000 ms
before retry. Exhausted rows are terminal, including repeated crash windows.
One row per worker iteration; scale service instances for throughput. Database
locks keep independent workers from concurrently sending the same delivery.

## Provider and external side effects

`EmailProvider.send(message, signal)` receives stable `delivery:<deliveryId>`
identity, recipient user reference, subject and text. Retries reuse identical
identity/content. Only `EMAIL_PROVIDER=fake` is supported. The fake is a safe
local sink: no SMTP/vendor requests and no sensitive content logging.
Independent durable `FakeEmailReceipt` records key, content fingerprint and
message ID. Retries across provider instances or completion rollback reuse the
same receipt; changed content under one key is rejected.

The provider must honor cancellation. A future production adapter needs trusted
user-to-email resolution, explicit error classification and vendor idempotency
or reconciliation. Events currently identify users, not email addresses; no
address is invented or fetched synchronously during checkout.

If a provider accepts an email and the process dies before completion commits,
recovery cannot infer external success from the delivery row. Stable identities
enable idempotent providers (proven for the fake). A non-idempotent provider can
physically send duplicates after timeout/crash; an ignored cancellation or lost
DB connection can also leave an external request in progress after local lock
release. This service guarantees one logical notification, one durable channel
delivery, bounded persisted attempts and observable final state. It does not
guarantee exactly-once physical email delivery. An exhausted ambiguous attempt
can be `FAILED` despite external acceptance; inspect/reconcile provider identity.

## Two retry domains

Broker acceptance uses unchanged shared event validation, short retries, durable
cross-redelivery budget (default 3), conflict/poison classification and confirmed
DLQ quarantine. Failed acceptance creates no successful Inbox receipt or email
intent. Committed duplicates may ACK even after the attempt budget is consumed.

Email retries begin after acceptance and ACK. Transient failures, timeouts and
unknown provider failures retry only within email budget. Permanent failures
fail immediately. Email retries neither requeue the source event nor consume
its broker budget. Completion DB failures retain the committed claim for stale
recovery. Error text never enters persisted diagnostics: only fixed
`EMAIL_TRANSIENT`, `EMAIL_PERMANENT`, `EMAIL_TIMEOUT`, `EMAIL_UNKNOWN`,
`EMAIL_CLAIM_EXPIRED`, `EMAIL_ATTEMPTS_EXHAUSTED` codes.

## Observability

Shared broker spans preserve incoming W3C parent context. Acceptance creates
`notification.consume` and `notification.persist` spans. Saved traceparent links
later `notification.email.send` root spans to the original trace. UUID business
correlation remains separate from W3C trace identity. Logs include source event,
event type, correlation, notification/delivery IDs, channel, attempt and state;
no email bodies, credentials or arbitrary provider text.

Protected `/metrics` exposes persisted `notifications_created_total`,
`notification_deliveries_total{status="SENT|FAILED"}`,
`notification_deliveries{status}`, `notification_delivery_retries_total`,
`notification_delivery_pending`, and
`notification_delivery_oldest_pending_age_seconds`. Pending includes delayed
and claimed work. Shared consumer/retry/DLQ metrics continue unchanged. No
event, notification, delivery or user IDs occur in metric labels. Ledger-based
counts depend on retained rows, following Phase 15 conventions.

## Readiness and shutdown

`/health` remains liveness. `/ready` checks PostgreSQL and active broker session;
it fails while stopping or disconnected. Notification always consumes, regardless
of `EVENT_DRIVEN_CHECKOUT`. Shared reconnection restores the consumer after
broker loss. Health probes are public internal service endpoints; `/metrics`
and business routes retain internal-secret protection, with Gateway boundaries
unchanged.

Shutdown marks unready, cancels new consumer deliveries and worker claims, drains
bounded consumer work and provider work, closes RabbitMQ/DB, then telemetry.
Shared overall shutdown deadline remains 8 seconds; consumer drain remains
3 seconds. Forced termination leaves unfinished committed claims recoverable
after expiry. No claim is released while its send still holds the DB lock.

## Configuration and deployment

Notification requires `DATABASE_URL`, `GATEWAY_SECRET`, `RABBITMQ_URL`; optional
provider/budget are described above. Example files contain only local placeholder
credentials. Root `RABBITMQ_URL` is a host endpoint;
`COMPOSE_RABBITMQ_URL` supplies Order/Notification container endpoint and must
match configured broker credentials. Deployment runs the additive Notification
migration and regenerates its tracked Prisma client. Test Compose waits for
Notification's broker dependency and probes `/ready`. Order no longer depends
on Notification startup. No vendor dependency, CI/CD or Phase 18 work added.

## Testing guarantees

Fast tests cover supported mapping, templates, unsupported facts, stable identity,
safe errors, retry classification/backoff/exhaustion and configuration. Real
PostgreSQL tests cover acceptance rollback, duplicates/concurrency, committed
claims, concurrent send/recovery fencing, success/retry/permanent failure/timeout,
abandoned-claim exhaustion, durable fake identity, completion rollback after
provider acceptance, metrics and worker drain. Real RabbitMQ checks acceptance
before email, duplicate ACKs, trace/correlation, poison quarantine and durable
budget under repeated delivery. Shared Phase 16 generic messaging tests remain.

Order tests prove HTTP lifecycle/Outbox atomicity and rollback. Their Catalog
fixtures now use canonical UUID product IDs. A new shuffle seed also exposed
Gateway flood-test quota leakage; per-case public limiter-key reset isolates
fixtures without changing quotas or security assertions.

Async E2E proves confirmed and payment-declined workflows each create one Inbox,
notification, `SENT` delivery and matching fake receipt with one logical send,
including duplicate source publication. Sync E2E stops Notification, completes
checkout/confirmation/cancellation, restarts Notification and observes both
queued lifecycle emails. Existing broker outage/Order SIGKILL, Saga, security
and observability checks stay in place. No arbitrary test sleeps added. Cleanup
includes every new Notification table and only targets guarded disposable DBs.

Verification commands and results are recorded in `TESTING.md`. Remaining limits:
fake provider only, no real-address resolution or vendor reconciliation; retained
ledgers need future retention policy; one delivery per local worker iteration;
external physical exactly-once is not promised.
