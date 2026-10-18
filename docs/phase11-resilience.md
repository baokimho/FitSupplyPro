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
