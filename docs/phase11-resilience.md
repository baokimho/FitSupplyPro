# Phase 11: Failure handling and resilience

## Baseline audit

Baseline HEAD: `470c5d005c4147d01e6a31064c7960034fb0bfbf`; clean `main`.

| Caller | Every synchronous dependency operation | Previous timeout/retry |
| --- | --- | --- |
| Gateway | Proxies Auth, Catalog, Inventory, Order, Cart, Payment, Shipping, Notification | Fixed 5s socket/proxy timeout; no retries |
| Gateway/shared auth loader | Auth `/jwks` GET; cached key and coalesced concurrent load | No timeout; no internal retries |
| Order | Catalog product GET; Inventory batch POST (read); Inventory reserve/release/consume POST; Cart GET; versioned Cart item DELETE; Notification POST | No timeout; no HTTP retries |
| Payment | Order payment-snapshot GET and internal confirm PATCH, including confirmation reconciliation GET | Fixed 5s fetch AbortSignal; no HTTP retries |
| Cart | Catalog product GET | No timeout; no retries |
| Shipping | Order shipping-snapshot GET and Notification POST | No timeout; no retries |
| Payment provider | Fake settle/refund through independent PostgreSQL receipt connection | No network provider; no explicit provider deadline/retry |

There are no other production fetch/HTTP client sites. Notifications are best
effort and unprotected against duplicate creation. Inventory operation IDs and
provider keys already protect supported mutations. Cart version guards do not
provide an original response replay contract. No new service features are needed.

Async retry owners before changes:

- `checkoutMessageHandler`: three attempts, 100/200ms linear waits; every error
  except schema errors and HTTP 4xx retried, including unexpected programming
  failures. No cancellation during wait. Canonical event object reused.
- `consumeRabbitMq`: ACK only after completed work, permanent/exhausted failures
  NACK without requeue into existing DLX/DLQ. No delayed retry queues. Broker loss
  requeues unsettled deliveries. Shutdown drain limited to 3s.
- Outbox dispatcher: one confirmed publish per dispatch; database stores attempts,
  lastError and nextAttemptAt. Exponential 500ms..30s delay; 500ms idle polling.
  This is durable eventual scheduling, not a finite request retry loop. Infinite
  deletion/abandonment on an arbitrary attempt count would violate Phase 9 intent.
- Checkout session reconnect: retries opening a failed broker session every 1s
  until recovery or stop; no exponential pacing. Initial connection failure fails
  startup. Broker connection timeout 3s configurable, confirm timeout 3s fixed.
- Saga recovery: durable staged financial acknowledgement and explicit same-source
  replay; no separate background Saga retry loop. Failure callbacks record diagnosis.
- Payment: stable provider settle/refund key, durable pending intent, row locks,
  confirmation fallback GET after ambiguous failure. No provider retry loop.
- HTTP client/workflow retries belong to external caller under original key;
  Gateway never repeats requests. Adding service HTTP retry underneath consumers
  indiscriminately would multiply consumer attempts.

Readiness: 3s response deadline for local DB probe; driver query is not cancelled
by that timer. Optional broker readiness goes false on connection/channel loss.
Dependency HTTP availability is not recursively probed. PostgreSQL pools had no
explicit connection/query/statement deadlines. Shutdown has 8s overall deadline;
no shared shutdown AbortSignal. Existing correlation/Pino context flows across
calls; Outbox attempts and consumer attempts logged, no common failure taxonomy.
Broker publications carry existing `x-request-id` / `x-trace-id` context headers;
RabbitMQ supplies native dead-letter metadata. There is no persisted consumer
retry-attempt header or delayed retry-queue counter. Outbox attempts are durable;
short consumer attempt counters reset on a fresh broker redelivery.

## Decisions

Reuse existing HttpError, Pino/context, provider/operation keys, consumer settlement,
Inbox and Outbox. Classify failures explicitly; unknown errors fail immediately.
No Gateway retries. Service HTTP retry only for known safe sync Order reads and
Inventory commands carrying the same operationId. Payment HTTP/provider attempts
stay single-attempt so async consumer owns their retry budget. Existing durable
Outbox and reconnect scheduling remain independent owners with capped pacing.

No circuit breaker: no external network provider, no evidence of sustained
dependency saturation requiring shared circuit state. Bounded calls and attempts
address discovered hangs/amplification directly. A breaker can be added later
with measured traffic and failure thresholds; it does not replace readiness.

## Failure taxonomy

- **Transient:** HTTP 502/503/504, recognized connection/reset/DNS timeout codes,
  PostgreSQL connection/serialization/deadlock/unavailability codes and Prisma
  connection/pool/transaction-conflict codes. Raw-query errors inspect SQLSTATE
  inside Prisma P2010 metadata. Generic P0001 or unknown/programming errors are
  permanent, not catch-all retry candidates. Wrapped upstream HTTP 500 stays
  permanent even if public API maps dependency failures to 503.
- **Permanent:** schema/envelope errors, authoritative 4xx, business rules,
  insufficient stock, invalid transitions, idempotency mismatch, unknown errors.
- **Ambiguous:** network/timeout failure for a mutation that may have committed,
  including provider calls and Inventory response loss. This classification alone
  grants no retry permission. Caller must declare safety using existing identity.
- **Cancelled:** shutdown/caller AbortSignal; never a dependency timeout. Backoff
  exits immediately; cancelled checkout processing requeues during shutdown.

`DependencyError` extends existing `ServiceUnavailableError`; public envelope/code
remain compatible. Dependency, operation, safety and classification remain typed.
Existing service-specific business error mapping is retained.

## Timeout policy

| Caller | Dependency / operation | Default timeout | Configuration | Retry owner |
| --- | --- | ---: | --- | --- |
| Gateway | Eight proxy routes, native socket/proxy limits | 30000ms | `PROXY_TIMEOUT_MS` | No Gateway retry |
| Shared auth loader | Auth JWKS read, including response body | 2500ms | `DEPENDENCY_TIMEOUT_MS` | Next caller; cached/coalesced load |
| Order | Catalog GET, Inventory batch/read/mutations, Cart GET/DELETE, Notification POST | 2500ms per attempt, including response body | `DEPENDENCY_TIMEOUT_MS` | Order only for eligible operations |
| Payment | Order snapshot GET, confirm PATCH and reconciliation GET | 2500ms each | `DEPENDENCY_TIMEOUT_MS` | Consumer or external workflow replay; no HTTP inner retry |
| Payment | Fake provider settle/refund acknowledgement | 2500ms | `DEPENDENCY_TIMEOUT_MS` | Consumer or same-key command replay |
| Cart | Catalog GET | 2500ms | `DEPENDENCY_TIMEOUT_MS` | External caller; no inner retry |
| Shipping | Order GET / Notification POST | 2500ms | `DEPENDENCY_TIMEOUT_MS` | External caller; no inner retry |
| All existing service pg pools | Pool acquisition / connection | 2500ms | `DB_CONNECT_TIMEOUT_MS` | Caller policy where safe |
| All existing service pg pools | Server statement execution | 5000ms | `DB_STATEMENT_TIMEOUT_MS` | Caller policy where safe |
| Readiness | Local DB readiness response | 3000ms | Existing constant | None |
| Broker | Connection / publisher confirm / consumer drain | 3000ms each | Connection: existing `RABBITMQ_CONNECTION_TIMEOUT_MS`; others existing constants | Session / Outbox |
| Service lifecycle | Graceful shutdown | 8000ms | Existing constant | None |

Milliseconds validate as integers 1..60000. No schema or Prisma configuration
changes. Native PostgreSQL statement timeout cancels work server-side; readiness
response deadline alone does not cancel its probe, whose underlying query is now
bounded. HTTP AbortController covers headers and body, clears timers/listeners,
and composes caller cancellation. Production HTTP/provider calls supply Pino
loggers with dependency, operation, limit and elapsed time on timeout.

Gateway has a larger budget to allow application retries, but native proxy limits
are socket/inactivity limits rather than a whole-workflow transaction deadline.
Checkout with many sequential items may exceed Gateway budget; original client
key and durable recovery still matter. Raising limits requires coordinating
transaction, shutdown and upstream budgets; no unbounded per-call defaults.

Set variables in each caller's `apps/<service>/.env` for development Compose;
root `.env.example` documents them. Test Compose exposes root overrides using
one environment anchor. Defaults apply when unset; blank/invalid values fail.

## Retry policy and ownership

`retryOperation` has at most `DEPENDENCY_MAX_ATTEMPTS` total attempts (default 3,
validated 1..5), not that many retries plus initial attempt. Configured defaults:
base `RETRY_BASE_DELAY_MS=100`, cap `RETRY_MAX_DELAY_MS=1000`.

For failed attempt n, raw cap is `min(maxDelay, baseDelay * 2^(n-1))`;
delay is floor of cap times uniform 0.5..1 jitter. Default waits are 50..100ms,
then 100..200ms. Tests inject random/fake timers; no real exponential sleeps.
Every retry checks safety and classification; permanent errors stop immediately.
AbortSignal stops backoff and prevents next attempt. Correlation context survives.

| Caller | Operation | Retry owner | Attempts | Backoff | Safety |
| --- | --- | --- | ---: | --- | --- |
| Gateway | All proxies | No Gateway retry | 1 | None | No blind mutation replay |
| Order | Catalog GET, Cart GET, Inventory batch read | Order HTTP client | 3 default | Configured exponential jitter | Read-only |
| Order | Inventory reserve/release/consume | Order HTTP client | 3 default | Same policy | Original operationId required |
| Order | Cart DELETE, Notification POST | No inner retry | 1 | None | No original-response replay guarantee |
| Payment | Order GET / confirm PATCH / provider command | Checkout consumer or external same-key replay | 1 per local attempt | Consumer policy if async | Provider key / idempotent confirmation |
| Cart / Shipping / JWKS | Existing dependency calls | No inner retry | 1 | None | Bound hangs without multiplying workflow retries |
| Checkout consumer | One validated event handler + result intent | `checkoutMessageHandler` | 3 default | Configured exponential jitter | Same eventId; Inbox + domain/provider keys |
| Outbox | One publication per dispatch | Existing durable dispatcher | 1 per dispatch | 250..500ms initially, exponential cap 30000ms | Same serialized event and durable row |
| Broker session | Failed connection recovery | Existing session monitor | 1 per scheduled reconnect | 500..1000ms initially after failure, exponential cap 30000ms | No business mutation; successful reconnect resets counter |

Outbox and session recovery are durable/background scheduling, not unbounded
request retry loops. Pending Outbox intent remains until confirmed; abandoning it
after N failures would violate Phase 9. Retry pacing is capped and stop cancels
timers. Outbox published markers, claims, confirms and atomicity remain unchanged.
Healthy session monitoring remains every 1000ms, Outbox idle polling every 500ms.

Consumers keep a short bounded internal retry because topology has no delayed
redelivery queues. Adding immediate NACK/requeue for infrastructure failures would
hot-loop; building delayed retry/DLQ administration is outside this phase. After
permanent/exhausted failure, existing NACK without requeue/DLX applies. Malformed
events fail before work. Duplicate Inbox events succeed and ACK. Shutdown aborts
dependency waits/backoff, skips failure diagnostics, and requeues cancellation
instead of dead-lettering it. Already committed effects remain protected by Inbox.

Payment never adds an HTTP/provider retry inside the consumer's retry budget.
Order Saga event handling is local DB work; it does not invoke the retrying sync
Order HTTP client. There is no Gateway x Order x Payment retry multiplication.
Confirmation reconciliation GET is a distinct state read after failure, not a
second blind financial mutation.

## Retry safety and identities

| Operation | Automatically retry safe? | Identity / reason |
| --- | --- | --- |
| Catalog / Cart GET, Inventory batch lookup | Yes in Order | No state mutation; same trace and request headers |
| Inventory reserve/release/consume | Only with operationId | Body constructed once outside retry closure; no fresh ID |
| Checkout API replay | Client controlled | Original Checkout Idempotency-Key, same durable attempt |
| Provider settle/refund | Only consumer/client replay | `${paymentId}:settle` / `${paymentId}:refund` unchanged |
| Incoming checkout event | Only classified failures | Canonical event object and eventId unchanged on every attempt |
| Notification POST | No | No durable external request identity |
| Versioned Cart DELETE | No automatic retry | Version conflicts do not replay original response |
| Arbitrary unprotected mutation | No | Ambiguous remote effect could duplicate |

An additional correctness gap was found in sync checkout: all reservation
responses could be lost after commit, while only acknowledged reservations were
recorded. Existing `CheckoutIdempotency.reservedItems` now retains
`reservationUnknown` on exhausted ambiguous reservation. Same-key compensation
replays the original reserve operationId to resolve its result before releasing
under the original release ID. This prevents releasing another order's stock
without confirming the original reservation. Existing failure-state contract
remains: compensated failure is terminal; fresh eligible request uses a new key.
No new table or retry identity was introduced.

Direct synchronous order creation has no durable HTTP creation-key replay contract;
automatic Inventory retries still retain operationId within that invocation, but
exhausted ambiguity may need operational reconciliation. Phase 11 does not add a
new API idempotency feature. Process failure between remote commit and local
recording also cannot be made atomic without additional workflow changes.

## Diagnostics

Intermediate retry logs include dependency, operation, failureClass, attempt,
maxAttempts, timeoutMs where supplied, retryDelayMs and exhausted=false. Final
failure has exhausted=true only when eligible retry budget was consumed. Unknown
errors are not relabeled transient. Timeout logs include elapsedMs and timeoutMs.
Gateway proxy failures include method/path, limit, elapsed time when started, and
read-vs-mutation failure class. There are no Gateway retry attempts.

Existing AsyncLocalStorage/Pino adds trace/request identity. Consumer child logger
adds eventId, correlationId, causationId and workflow metadata. Outbox logs retain
event/row identity, persisted attempts and next delay. No payload, body, provider
key, token, credentials or payment amounts are added to retry/timeout logs.
No breaker means no open-circuit state to report.

## Relationship to previous phases and limits

Phase 9 Outbox protects producer publication. Phase 10 Inbox protects duplicate
consumer processing. Phase 11 bounds and classifies temporary failure handling.
Retries depend on those existing identities; they do not replace transactions,
compensation, lifecycle guards or provider acknowledgements.

- External interactions still cannot atomically commit with local databases.
  Fake provider receives cancellation signal and checks before/after its receipt;
  already issued DB work uses the native statement timeout, not AbortController
  cancellation. A late provider receipt can survive timeout and must be replayed
  under the same key. Future network adapters must honor supplied signal.
- RabbitMQ remains at-least-once; global ordering and exactly-once delivery are
  not guaranteed. Retries increase latency, especially across sequential items.
- No circuit breaker, request-wide workflow deadline, retry concurrency limiter,
  rate-adaptive retry budget, or new automatic Saga repair worker was added.
  Caller retry traffic still needs normal gateway rate limits and capacity work.
- Circuit breaking is not a readiness/health substitute. Existing legacy lifecycle
  behavior remains; services already using installShutdown now abort dependency
  work and backoff before draining.
- Outbox/Inbox retention, DLQ replay/repair and poison-message recovery remain
  Phase 12; full metrics/tracing remain later Observability work.

See [TESTING.md](../TESTING.md) for exact verification and recovery scenarios.
