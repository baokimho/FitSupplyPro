# Phase 10: Idempotency and transactional Inbox

## Baseline audit (before changes)

Live RabbitMQ subscriptions are enabled only by `EVENT_DRIVEN_CHECKOUT=true`:

| Queue / owner | Actual bindings | Handler |
| --- | --- | --- |
| `inventory.order-created` / Inventory | `order.created`, `order.cancelled` | `handleInventoryCheckout` |
| `payment.inventory-reserved` / Payment | `checkout.payment_requested`, `checkout.refund_requested` | `handlePaymentCheckout` |
| `order.payment-events` / Order | `inventory.reserved`, `inventory.reservation_failed`, `inventory.released`, `inventory.release_failed`, `payment.succeeded`, `payment.failed`, `payment.refunded`, `payment.refund_failed` | `handleOrderCheckout` |

Topology declares `notification.order-events` bound to `order.confirmed` and
`order.cancelled`, but Notification has no RabbitMQ subscription. No checkout
consumer binds `order.processing_started`. Order accepts cancellation in its
handler type list but its queue does not bind it. Payment retains a legacy
`inventory.reserved` adapter, while topology explicitly removes that binding.
No new consumers are needed.

All three databases already contain `CheckoutEvent(eventId PRIMARY KEY,
fingerprint, result)`. `processCheckoutEvent` takes a transaction-scoped advisory
lock on incoming `eventId`, validates its canonical-envelope fingerprint, runs
work, stages resulting Outbox intent, then inserts the receipt. Existing primary
key is the final concurrency guard. Duplicate content conflicts are permanent
409 errors, not successful duplicate deliveries.

Inventory already commits receipt, stock changes, `InventoryOperation`, and
Outbox together. Conditional stock updates and unique `operationId` prevent
over-reservation and repeated domain operations; a savepoint rolls back partial
multi-product reservations before recording a reservation-failure outcome.

Order already commits its main Saga/Order transition, receipt, and Outbox
together under an Order row lock. Payment success acknowledgement is deliberately
staged separately in the Saga (`paymentEventId` and fingerprint), preserving
knowledge of acknowledged money when confirmation fails. This is recoverable
preparation, not a processed receipt. Legacy Saga initialization and failure
diagnostics also persist independently; they must not be mistaken for completed
event processing.

Payment had a concrete atomicity gap: its receipt transaction invoked `create`
and `command`, each opening separate transactions. Financial state and Outbox
could commit before the receipt insert failed. Stable provider keys and Outbox
deduplication already recovered this window, but local final state, Outbox, and
receipt were not atomic.

Broker settlement waits for handler completion and durable Outbox intent.
`checkoutMessageHandler` retries transient errors three times in-process;
permanent validation/4xx errors fail immediately. Exhausted/permanent failures
NACK without requeue into the existing DLQ. Closing a channel requeues unsettled
deliveries; stopping consumers NACKs newly arriving deliveries with requeue.
Failure callbacks may stage compensation diagnosis independently of failed work.

## Inbox model and uniqueness

Evolve `CheckoutEvent`, keeping existing receipts and primary key. Add incoming
`eventType` and `processedAt` through additive migrations. Historical event type
is nullable because old receipts did not store it; all new receipts record it.
Historical timestamps represent migration time, not reconstructed processing
time. `processedAt` uses the database timestamp default, not an ACK timestamp.

Uniqueness is **service database + eventId**: each service has one logical checkout
handler behind one queue, dispatching by event type. The same event can correctly
be processed once in Inventory and once in Order. No global cross-service key or
second Inbox abstraction is introduced. Additional independent handlers in one
database would require an additive consumer scope and matching lock scope.

The existing PostgreSQL advisory transaction lock serializes competing workers
before SELECT/work/INSERT; the primary key independently rejects duplicate rows.
Keep this narrow raw SQL: Prisma has no transaction-scoped advisory-lock API.
No permanent in-progress receipt is created outside the business transaction.

## Final processing algorithm

1. Deserialize and validate canonical V1 envelope and allowed handler event type.
2. Begin the service database transaction; acquire incoming-event advisory lock.
3. Read Inbox receipt. Matching fingerprint replays stored result (including null)
   without business work or a new Outbox row. Mismatched content is rejected.
4. For a new event, execute guarded business transition and stage outgoing Outbox
   intent using the same transaction client. Insert incoming identity, type,
   fingerprint, serialized result and database processing timestamp.
5. Commit, then ACK. Failure rolls back receipt, final transition and Outbox;
   existing transient/permanent retry and DLQ policy applies.
6. A commit followed by crash before ACK is a duplicate on redelivery. Replay
   needs no new business effect or output identity. The dispatcher independently
   confirms publication and marks pending Outbox rows.

Payment's `command` reuses its existing transaction implementation with the
consumer's transaction client. HTTP commands retain their original transaction
ownership. Payment identity creation and pending provider-command intent remain
durable preparation before the provider call, preserving payment ID/provider key
across rollback. Final SUCCEEDED/FAILED/REFUNDED, Outbox and Inbox commit together.
Fake provider receipts use an independent committed connection, as a real provider
would; they cannot participate in the local transaction. Retrying reuses the same
settlement/refund key. No Prisma transaction plumbing crosses service boundaries.

The message adapter may upsert a returned result into Outbox again after handler
commit; existing event/key uniqueness makes this a no-op. It never publishes
directly in the service Outbox path. Compensation-failure diagnostics remain
separate from successful processing: a failed delivery has no processed receipt.
Repeated failed attempts may emit separate diagnostic events; successful source
replay remains deduplicated.

## HTTP audit

- Order uses unique `(userId, idempotencyKey)`, canonical semantic fingerprints,
  durable attempt/result records, conflict checks and atomic claim/conditional
  updates. Completed replay returns the original snapshot. Recovery retains
  compensation/finalization state instead of repeating completed reservations.
- Payment creation uses unique `(userId, action, idempotencyKey)`, semantic Order
  fingerprint, transaction advisory locks and a durable response snapshot. Same
  key with another Order is rejected; concurrent same-key requests converge.
  Active-attempt constraints and per-Order locking also protect different keys.
- Payment confirm/fail/refund endpoints use guarded lifecycle commands rather
  than an additional HTTP Idempotency-Key abstraction. Row locks, pending-command
  intent and stable `${paymentId}:settle` / `${paymentId}:refund` provider keys
  converge on one financial effect. Duplicate target-state commands are safe;
  incompatible terminal transitions remain conflicts. A creation key retains its
  original response snapshot when its payment later fails; a fresh key may start
  a new eligible attempt. Provider/Order failures retain recovery intent.
- Existing integration suites cover changed semantic requests, same/different-key
  races across Prisma clients, durable replay, failed-attempt behavior, lost
  provider acknowledgement and refund recovery. No HTTP implementation changes
  were necessary; synchronous checkout remains default and async remains opt-in.

## Reliability boundaries

| Mechanism | Boundary | Identifier | Protects |
| --- | --- | --- | --- |
| Inbox (`CheckoutEvent`) | Service checkout consumer | `eventId` | Repeated delivery of one integration event |
| Domain operation (`InventoryOperation`) | Inventory mutation | `operationId` | Repeated reserve/release/consume business operation |
| HTTP idempotency | External request | `Idempotency-Key` scoped by user/action | Client request retry and response replay |
| Provider idempotency | External financial operation | Payment ID plus settle/refund | Charge/refund replay across local rollback |
| Outbox (`OutboxEvent`) | Producer publication | Unique event ID / logical deduplication key | Lost publication after local DB commit |

Producer reliability atomically persists **DB mutation + outgoing publication
intent**. Consumer reliability atomically persists **incoming event identity +
business transition + outgoing publication intent**, with the explicit financial
preparation exceptions above. These identifiers address different boundaries;
one does not replace another. Correlation links the workflow; causation identifies
the source event. V1 contracts remain unchanged.

## Rollout and limits

Apply `20261018010000_consumer_inbox` migrations to Order, Inventory and Payment,
regenerate clients, then replace active checkout workers. Existing receipts remain
valid and no development database reset is required. Avoid mixed worker versions
when claiming atomic consumer guarantees: old Payment binaries still have the
audited split transaction. Old receipts with null event type still deduplicate.

- RabbitMQ remains at-least-once, with no exactly-once delivery claim, distributed
  transaction, cross-service atomic commit or global event ordering guarantee.
- External provider effects and durable preparation may survive a rolled-back
  consumer transaction. Provider idempotency and Saga recovery remain required.
- Failure diagnostics and staged Saga financial acknowledgements are recoverable
  records, not proof of successful consumer completion.
- Existing bounded retries/dead-letter policy remains; automatic business repair,
  DLQ administration/replay, advanced resilience and provider integration are
  outside Phase 10.
- Retention/cleanup of Inbox and Outbox is not implemented. Deleting receipts
  removes their delivery-deduplication history and requires a retention policy.
- No Notification/Shipping consumers or unrelated services were added.

See [TESTING.md](../TESTING.md) for verification commands and results.
