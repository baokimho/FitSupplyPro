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
