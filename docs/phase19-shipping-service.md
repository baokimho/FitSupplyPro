# Phase 19 — Shipping Service

Phase 18 hard gate closed first at `1490d66`: audit/documentation complete,
850 fast cases plus 9 runner checks, 337 integration cases, 18 E2E cases,
typecheck/lint/build passed; local commits and clean tree verified before Shipping
audit began. Phase 18 and Phase 19 implementation commits are separate.

## Audit and applicability

Before this phase Shipping already offered admin-routed shipment creation/status
updates, owner-scoped reads, a unique Order identity, copied Order delivery
snapshot and `PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED` states.
Seven PostgreSQL tests covered snapshot copying, creation duplicates, ownership
and legacy HTTP notifications. Two fast tests covered downstream error envelopes.
Shared HTTP metrics/tracing, dependency deadlines and shutdown existed.

Real gaps: service methods allowed owner mutations despite Gateway admin policy;
state read/check/write could race backward; repeated status requests repeated
notifications; tracking was mutable and nonunique; post-commit best-effort HTTP
notifications could be lost; Order payloads were unchecked; dependency errors
could expose diagnostics; safe read retries/UUID headers and DB readiness were
missing; runtime npm/watch wrapper complicated signal delivery.

There is no carrier API, external label-allocation operation, Order-event consumer,
Shipping Inbox or automatic shipment-creation requirement in this repository.
Shipment creation remains an explicit admin command. Automatically consuming
`order.confirmed` would change fulfillment initiation and create new domain
effects without an established requirement. Registered `order.processing_started`
has no real producer. Neither event is repurposed to automate Shipping.

Thus P19's conditional incoming-consumer/Inbox and external-carrier/provider
requirements are inapplicable to Shipping intake. No fictional provider mutation,
provider success receipt or physical exactly-once guarantee is claimed. Actual
outgoing events have a real Notification consumer and use existing infrastructure.

## Ownership and lifecycle

Order owns payment decisions, inventory orchestration and its purchase/delivery
snapshot. Shipping copies the confirmed Order's authoritative owner/address and
owns its independent fulfillment record and manual tracking identity. It never
calls Payment/Inventory, changes Order state or accesses Notification delivery
internals. Caller-supplied snapshot fields remain rejected by strict create DTO.

Both service and Gateway now require ADMIN for creation/status mutations.
Customer owner reads and foreign-read 403 remain unchanged. Missing internal
secret/identity retain existing 403/401 envelopes. Repeated create returns the same
logical shipment (and existing 201 HTTP status), including after Order progresses.
One Order/one shipment remains database-enforced. No multi-shipment feature added.

Creation is still eligible only while Order is `CONFIRMED`; new shipment starts
`PROCESSING`. Before a new SHIPPED/DELIVERED transition, read-only Order snapshot
must be `PROCESSING`, `SHIPPED` or `DELIVERED` with matching owner. A confirmed
Order is still cancellable; requiring processing before dispatch prevents recording
dispatch of cancelled/still-cancellable purchase intent. Order PROCESSING itself
is not customer-cancellable. Shipping does not perform that Order command.

Existing forward skips remain allowed with tracking. Backward transitions fail
400. DELIVERED cannot move elsewhere. CANCELLED remains terminal, including its
existing 400 duplicate-update rule. Exact duplicate non-cancelled status/tracking
returns current record without timestamp change or another event. Independent
Shipment cancellation does not refund Payment, release stock or cancel Order.

Tracking is explicit admin-entered manual information, not a carrier-authenticated
identifier. It is globally unique in this domain, immutable after assignment,
bounded to 128 characters and rejects blanks/padding/control characters. Changed
identity returns 409; database uniqueness also returns shared safe 409. Shipped
and delivered states require tracking. No client-supplied provider identifiers
are trusted or stored, and no carrier/webhook proof is invented.

## Transactions and concurrency

Creation fetches and validates Order outside any local transaction. Inside short
transaction, advisory lock `shipping.order:<orderId>` serializes duplicate creates;
the existing row is rechecked before insertion. Unique Order constraint remains
the integrity boundary. Duplicate creation copies no new address or owner data.

Status commands validate input/current state and, for dispatch, fetch Order
outside the local transaction. A transaction then locks Shipment with
`SELECT ... FOR UPDATE`, rereads state, revalidates transition/tracking, and commits
state plus event intent together. Concurrent SHIPPED/DELIVERED commands either
progress in valid order or reject obsolete SHIPPED after DELIVERED. They cannot
silently move backward. Unique tracking failure or Outbox failure rolls back all
local effects. No local transaction spans an Order HTTP call or carrier call.

## Final flow and event contract

```text
Admin command
     |
Order shipping-snapshot GET (read-only, bounded)
     |
Shipping transaction
  lock Shipment / validate transition
  Shipment state + OutboxEvent
     |
   COMMIT / HTTP response
     |
shared Outbox publisher
     |
domain.events
  shipment.shipped / shipment.delivered
     |
notification.order-events
     |
Notification transaction: Inbox + Notification + EMAIL delivery
     |
   COMMIT / ACK
     |
existing email worker / FakeEmailProvider
```

New V1 facts are `shipment.shipped` and `shipment.delivered`, producer
`shipping-service`, payload `{ orderId, shipmentId, userId }`. No address, phone,
message body or credentials enter integration payloads. Canonical UUID envelope,
Zod registry and producer/version validation are shared. HTTP commands start
facts with `causationId=null`; UUID correlation follows request context (or fresh
UUID for direct service invocation). No nonexistent incoming Order event is
claimed as causation.

Each transition uses stable Outbox deduplication key
`shipment:<shipmentId>:SHIPPED|DELIVERED`. Row lock/no-op semantics prevent duplicate
event creation. Notification's existing queue adds both routing-key bindings;
DLX/DLQ names remain unchanged. Templates preserve existing ORDER_SHIPPED /
ORDER_DELIVERED customer titles/messages, now accepted through durable Inbox and
processed by Phase 17 email worker. Direct Shipping HTTP notification path and
its runtime URL dependency are removed. Existing Notification APIs remain.

## Retry, ambiguity and crash recovery

Order GET uses shared deadline/cancellation and bounded safe retry/backoff/jitter.
Malformed/mismatched snapshots return safe 503; missing Order/domain 4xx preserve
existing envelopes. Dispatch validation is permanent and not automatically retried.
No unsafe external mutation retry exists because no carrier mutation exists.

Shipment state and Outbox intent commit together or neither does. Crash before
commit rolls back; retry revalidates. Crash after commit/before response is safe:
create returns existing shipment; duplicate transition returns current record;
pending Outbox survives process death. Broker loss leaves intent pending without
blocking HTTP acceptance. Shared Outbox retries/backoff resume after reconnection.

Confirm-before-published-marker loss can publish the same envelope again. This is
publication ambiguity, not proof of a second physical shipment. Notification Inbox
deduplicates canonical event identity/fingerprint atomically with effects. Email
uses stable delivery identity and existing persisted budget/fake receipts. Physical
email exactly-once remains unclaimed for non-idempotent future providers.

Unreceipted concurrent consumer copies share the existing durable three-attempt
acceptance budget; committed duplicates bypass it. Broker exhaustion/poison uses
existing confirmed quarantine. Operator inspection does not remove DLQ copies;
explicit selected replay confirms publication before ACK of selected copy. New
shipment routing keys are included in replay validation. Recovery after prior
email success creates neither another logical notification nor email delivery.
No Shipping consumer, Shipping DLQ or Shipping Inbox table is needed for this
manual-intake/publisher-only flow.

An eventual real carrier adapter must add stable operation identity/reconciliation
for ambiguous timeout, cancellation-aware bounded calls, persisted provider result
and crash recovery. Those operations must stay outside local Shipment transactions.
This phase deliberately adds no unused provider interface or fake physical booking.

## Readiness, shutdown and observability

`/health` is liveness; `/ready` performs bounded PostgreSQL check and rejects while
stopping. Broker is outbound-only: work can safely commit while unavailable, so
it does not gate Shipping HTTP readiness. Missing `RABBITMQ_URL` leaves durable
intents pending; configure it for outbound delivery. Provider reachability is not
a readiness dependency because no provider exists.

Direct Node execution delivers Docker signals to shared lifecycle handler.
Shutdown stops new HTTP work and Outbox claims, cancels dependency work, drains
bounded accepted work, closes broker/DB/pool and telemetry. Shared 8-second overall
deadline and 5-second Outbox transaction bounds remain. Forced termination leaves
pending intent or rolled-back transaction; no incomplete incoming message is ACKed
by Shipping because it has no incoming consumer. Notification ACK/drain semantics
remain shared and unchanged.

Shared HTTP/dependency/RabbitMQ/Outbox metrics remain. Persisted
`shipments_created_total`, `shipping_shipments{status}`,
`shipping_events_committed_total{event_type}`, `outbox_pending_total` and
`outbox_oldest_pending_age_seconds` show committed state and delayed backlog.
No IDs/tracking/address fields occur in metric labels. `shipping.create` and
`shipping.transition` spans inherit request context. Order GET carries UUID and
W3C headers; Outbox stores origin traceparent and later dispatch links to it;
Notification consumer and email spans continue correlation. Logs include Order,
shipment, event identity/type, correlation and staged status. Shared publisher and
Notification logs add attempts, replay/budget, committed acceptance and delivery
outcomes. No address/body/provider payloads or secrets are logged.

## Migration, rollout and tests

Additive migration creates standard Shipping Outbox and unique tracking index.
It does not rewrite/delete existing shipments. Existing duplicate tracking values
must be reviewed before rollout rather than silently changed. Generated Prisma
client is updated; guarded test cleanup includes Outbox. Deploy shared registry
and Notification bindings/templates before enabling new Shipping publisher; old
consumers otherwise quarantine unknown facts, recoverable by explicit replay after
upgrade. `COMPOSE_RABBITMQ_URL` supplies container endpoint and credentials.

Fast tests cover lifecycle, duplicates, stale/backward updates, pinned/validated
tracking, admin enforcement, safe Order failures/retries, new templates and all
canonical contract fields/UUID/version rules. PostgreSQL/API checks cover creation
duplicates, ownership, admin mutations, safe dispatch, concurrent locked transitions,
tracking uniqueness, status/Outbox rollback, correlation and persisted metrics.
Real RabbitMQ verifies confirm-before-marker rollback publishes same fact after
recovery; Notification tests verify shipment facts, concurrent duplicates,
post-receipt bypass, durable exhaustion, explicit DLQ replay and sent-email safety.

E2E retains full confirmed/processing/shipped/delivered manual journey and owner
boundaries, now awaits exact shipment-specific notifications. Recovery journey
stops broker, commits Shipping state/Outbox, SIGKILLs Shipping, restores broker and
process, and observes one published fact and one SENT fake-provider delivery.
Existing Saga/Notification/Cart/security E2E remain. Explicit barriers/eventual
assertions replace sleeps. Commands/results are recorded in `TESTING.md`.

Shuffle seed 19019 found earlier test-isolation issues: Order's global two-product
fault injection left sibling read retries crossing into the next test; fault is
now injected into one product while unchanged failure/compensation assertions
remain. Shared real RabbitMQ shutdown permanently aborts dependency work, so its
same cancellation/drain/redelivery assertions now run in a separate file using
dedicated temporary queues. No production retry/shutdown behavior is disabled.

## Intentionally unchanged and limits

Sync checkout stays default; async stays opt-in. Order/Payment/Inventory domain
semantics and Saga/Inbox/Outbox budgets remain. No new automatic fulfillment
trigger, carrier API, webhook, payment decision, inventory action, multi-shipment
model or distributed transaction was added. Tracking remains manual and does not
prove external carrier acceptance/delivery. Ledger retention and production carrier
integration/reconciliation remain future operational/product work.
