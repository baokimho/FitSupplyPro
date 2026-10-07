# Phase 4: Payment domain

Payment owns payment attempts, provider acknowledgements, full refunds and durable
command recovery. Order owns fulfilment and inventory orchestration. Payment calls
Order over authenticated HTTP; it never accesses `order_db`. Phase 5 has not started.

## Lifecycle and routes

```text
PENDING -> SUCCEEDED -> REFUNDED
PENDING -> FAILED
```

`FAILED` and `REFUNDED` are terminal. Repeating a completed command returns current
payment without contacting the provider. Other transitions return `409 CONFLICT`.
Rules live in `src/domain/payment-lifecycle.ts`, not controllers.

Existing routing style is preserved. Gateway prefixes service routes with `/payment`.

| Service route | Authorization | Effect |
| --- | --- | --- |
| `POST /payments` | Authenticated Order owner; `Idempotency-Key` required | Create pending attempt |
| `GET /payments/me` | Authenticated customer | List own attempts |
| `GET /payments/:id` | Payment owner | Read current attempt/recovery state |
| `PATCH /payments/:id/confirm` | ADMIN | Fake provider success simulation and Order synchronization |
| `PATCH /payments/:id/fail` | ADMIN | Fake provider failure simulation |
| `PATCH /payments/:id/refund` | ADMIN | Full provider refund |

Confirm/fail are privileged simulation commands, not customer payment-result APIs.
Gateway enforces ADMIN and overwrites identity headers. Payment also enforces ADMIN.
All business routes require shared internal secret. Public `/health` and `/ready`
follow existing shared conventions; readiness checks Payment's own DB only.

Create accepts only `{ "orderId": "<uuid>" }`; client amount, currency, status,
user and provider reference fields are rejected. Order exposes protected
`GET /internal/orders/:id/payment-snapshot` with owner, state, pending command,
exact decimal total and USD currency. Payment validates snapshot identity, owner,
currency and payable state. Money persists as Prisma `Decimal(10,2)`; API amount
is a two-decimal string. No floating-point monetary arithmetic is used.

## Provider boundary

Application service receives `PaymentProvider`; concrete construction lives in
`src/providers/index.ts`. Adapter supports acknowledged settlement and full refund.
Settlement can report failure even when confirmation was requested; Payment honors
actual result. A future real adapter must verify provider outcomes and implement
durable provider idempotency. It must never interpret an unverified caller assertion
as proof of payment. Adding that adapter does not change application lifecycle logic.

`FakePaymentProvider` is deterministic. Provider name remains existing `MOCK` in
Prisma; references are `fake_payment_<paymentId>` and `fake_refund_<paymentId>`.
Its `FakeProviderOperation` receipt ledger commits through an independent connection,
outside Payment's transaction. It simulates an external provider's durable receipts,
not real money. Unique operation keys/references and request fingerprints reject
different payload/outcome reuse. Refund must match successful settlement's identity,
amount and currency. Tests inject errors/response loss without public simulation knobs.

## Idempotency and concurrency

- Create scope is `(authenticated user, payment.create, Idempotency-Key)`.
- Header must contain 1–128 characters from `[A-Za-z0-9._:-]`, without whitespace.
- Fingerprint binds key to Order ID; committed key reuse with another Order is `409`.
- Payment plus creation response commit in one PostgreSQL transaction. Failure rolls
  back both, so the same request/key can retry without abandoned PROCESSING records.
- Successful create replay returns original saved response, even after payment status
  changes. Use GET for current state. Replaying a failed attempt's original key does
  not create another attempt; use a fresh key to retry payment.
- Different create keys for a pending Order converge on same active attempt.
- Failed attempts are immutable. A fresh key may create a new attempt if Order is still
  pending with no unfinished Order command. Partial unique index allows at most one
  nonfailed attempt per Order, including refunded attempts. No recharge after refund.
- PostgreSQL transaction-scoped advisory locks serialize create keys and Orders;
  row locks serialize financial commands and synchronization. Correctness spans
  separate service instances/connections; no process-local mutex or Map is involved.
- Before provider call, conditional update commits `pendingOperation`. Opposite
  commands cannot replace ambiguous intent. Retry same command to finish it.
- Provider keys are `<paymentId>:settle` and `<paymentId>:refund`, independent of HTTP
  retries. Retain provider receipts and creation idempotency rows with their attempts.

Before first confirmation, Payment rechecks Order owner, payable state and money.
Once intent exists, retries reconcile provider acknowledgement instead of refusing
recovery because Order changed during an ambiguous operation.

## Order synchronization and recovery

Provider acknowledgement precedes local financial status. `SUCCEEDED` commits before
calling existing `PATCH /internal/orders/:id/confirm`. Until sync completes,
`progressState` is `ORDER_CONFIRMATION_PENDING` and `orderConfirmedAt` is null.
Successful sync persists `ORDER_CONFIRMED` plus timestamp. Repeated confirmation
then skips provider and completed synchronization.

| Failure window | Durable state | Recovery |
| --- | --- | --- |
| Provider unavailable before acknowledgement | Old status; pending operation | Retry same command |
| Provider acknowledged; response lost or Payment write failed | Committed intent; provider receipt keyed by attempt | Retry retrieves same receipt and persists result |
| Payment succeeded; Order HTTP failed | SUCCEEDED; null sync marker | Retry confirm; no additional charge |
| Order confirmed; response or local sync-marker write lost | SUCCEEDED; null sync marker | Repeat internal confirmation; already confirmed is idempotent |
| Order advanced after lost response | SUCCEEDED; null sync marker | Snapshot CONFIRMED/PROCESSING/SHIPPED/DELIVERED proves convergence |
| Refund acknowledged; local write failed | SUCCEEDED; REFUNDED intent; provider refund receipt | Retry refund with stable key |

Failure never changes successful Payment back to PENDING/FAILED. Provider failure
never confirms or cancels Order. Refund never changes Order lifecycle; full refund
remains available even if Order confirmation is unresolved. If refund wins a race
with outstanding synchronization, terminal refund stops further confirmation retries.
Read current Payment/Order and reconcile according to actual provider outcome.

An Order cancelled concurrently with payment cannot safely be forced to CONFIRMED.
Acknowledged payment remains successful; operator can refund it. There is no atomic
transaction spanning Order, Payment and provider. Logs retain original causal error
and separately record secondary reconciliation failure. HTTP diagnostics stay out of
public error details. Correlation propagates across internal Order calls.

Order HTTP calls have five-second deadlines; DB transactions have fifteen-second
timeouts and bounded pool waits. Locks are held during synchronous provider/Order
calls. This favors simple correctness over high-throughput processing; retry after
timeout uses same durable identity. Payment readiness does not require Order readiness.

## Migration and limitations

Apply migrations with normal `prisma migrate deploy`; do not reset dev data.
`PAID` becomes `SUCCEEDED`; legacy `CANCELLED` attempts become `FAILED`. IDs, monetary
values and saved idempotency identities remain intact; cached amounts become strings.
One-payment-per-Order constraint becomes partial uniqueness. Existing legacy paid
records may lack provider references/receipts: do not invent a charge/refund receipt.
They need operational reconciliation before provider refund can be supported.

USD and full refunds only. No automated background recovery worker: operators
retry same privileged command and inspect structured logs/persisted state. Owner
GET responses expose `pendingOperation`, `progressState`, `failureCode` and
`orderConfirmedAt`. Persistent conflicts need manual
review. No claim of distributed atomicity or guaranteed convergence without retries.

Distributed consistency is currently **synchronous and retriable**. RabbitMQ, Saga,
Outbox, Kafka, Stripe, event-bus scaffolding and new Cart/Shipping/Notification work
are intentionally deferred to Phase 5+. Payment no longer invokes Notification.

## Verification

Lifecycle matrix, authoritative create validation, durable replay, failed-attempt
retry, provider outcomes, authorization, full refunds, independent-connection races,
real PostgreSQL write failures after acknowledgement, lost responses, Order recovery,
secret/correlation propagation, config, probes and legacy migrations have automated
coverage. Root gateway E2E includes failed-attempt retry and duplicate success/refund.
See [Testing](../TESTING.md) for executed verification totals and commands.

Payment package build copies generated Prisma runtime into `dist`; test Docker
executes compiled Node after migration deployment. Development Compose retains
source execution. Generated Prisma clients stay committed under existing repo policy.
