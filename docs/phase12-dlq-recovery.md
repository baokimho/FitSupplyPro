# Phase 12: DLQ recovery and replay

## Baseline audit

Baseline: clean `main`, `03b253a3f172f84446efe90c21a8469862603a01`.
No topology or business-contract redesign is needed.

- Durable topic `domain.events`, direct `domain.events.dlx`, four service queues
  and their durable `.dlq` queues already exist. Inventory consumes creation /
  cancellation; Payment consumes coordinator payment/refund requests; Order
  consumes inventory/payment outcomes. Notification queue has no live consumer.
- Source queues dead-letter on rejection to DLX under source queue name. Existing
  primitive consumer ACKs after completed work; ordinary failures NACK with
  requeue=false. Malformed envelopes/version/payload and unexpected handler types
  fail before business effects. Phase 11 distinguishes classified infrastructure
  failures from permanent business/unknown failures.
- `checkoutMessageHandler` owns up to three attempts with exponential jitter
  (configurable 1..5). No delayed retry queues. Attempts were memory-only and
  reset on channel/process redelivery. `x-death` is generated on dead-lettering,
  not on ordinary NACK requeue or channel-loss redelivery, so cannot supply the
  missing durable processing budget. Real broker tests verify native metadata.
- Shutdown cancellation, newly arriving deliveries during drain, and channel loss
  requeue unsettled work. There is no deliberate hot transient requeue loop, but
  repeated restarts could reset processing attempts indefinitely.
- Phase 10 `CheckoutEvent` records successful processing with mutation and Outbox
  in one service DB transaction. It must not become an in-progress attempt table.
  Inventory operation IDs and Payment/provider keys remain independent guards.
- Outbox owns durable publication retries and confirms. Session monitor owns
  capped reconnect scheduling; readiness reflects channel/broker state. Drain is
  bounded. None of these mechanisms provided operator inspection/replay.
- Existing headers carry request/trace context; native `x-death` includes queue,
  reason/count/routing history, but not application error classification or code.
  Existing logs had more context than a standalone DLQ message.

## Design decisions

Use a small `ConsumerDelivery` attempt ledger in each existing checkout service DB,
keyed by consumer queue, immutable body SHA-256 and explicit operator replay epoch.
Commit attempt claims before work; they survive rollback and process restart.
This operational evidence is separate from successful Inbox processing. No raw
SQL is needed for claims: Prisma conditional update plus primary key guards races.
Matching successful Inbox receipt bypasses spent budget so post-commit redelivery
can still ACK. Domain mutations retain their original transaction and identities.

Retain one Phase 11 retry owner. Each internal attempt must claim from the same
durable budget; broker redelivery does not reset it. Terminal handling publishes
unchanged bytes to existing DLX with safe diagnostic headers and publisher
confirms, then ACKs original. If quarantine publication cannot be confirmed, leave
source unacked and close channel for recovery. No business retry budget is reset.

Operator tooling inspects without ACK and replays one selected immutable message
to its original **queue**, avoiding fanout to unrelated subscribers. Replay requires
explicit confirmation, has bounded scan and replay counts, and ACKs DLQ copy only
after confirmed publication. Repair is deliberately separate from replay.

## Final failure and delivery policy

`deliveryFailureClass` refines Phase 11 rather than replacing its taxonomy:

| Classification | Examples | Handling |
| --- | --- | --- |
| TRANSIENT | Eligible dependency timeout, temporary DB outage, serialization conflict, exhausted delivery budget | Retry only within remaining durable budget; then quarantine |
| PERMANENT | Domain conflict, idempotency mismatch, invalid transition, unknown programming failure, non-retryable provider failure | No pointless retries; quarantine |
| POISON | Invalid UTF-8/JSON/envelope/payload/version, unknown/unsupported handler type, invalid replay metadata | No business work; quarantine |

Shutdown cancellation is not an application failure: Phase 11 drain/cancellation
still requeues unsettled deliveries and stops backoff. Duplicate committed events
ACK successfully. Successful Inbox fingerprint mismatch remains permanent.
An ordinary provider decline remains a valid processed `payment.failed` business
outcome with Saga compensation, not a transport failure requiring quarantine.

Normal path:

```text
validate event and handler type
claim durable attempt (or detect successful Inbox duplicate)
business mutation + Outbox + successful Inbox transaction
commit
ACK
```

Retry/exhaustion path:

```text
classified transient failure
Phase 11 exponential jitter wait
claim another attempt from SAME persisted budget
success: ACK
exhaustion: confirmed quarantine publication, then ACK source
```

Poison path validates before business work and spends no domain-processing
attempts. No poison NACK/requeue loop exists. A permanent business failure spends
one claim, then quarantines. An already consumed budget retains TRANSIENT cause
classification but is ineligible for further internal retry.

## Durable accounting and ownership

Additive `20261021010000_consumer_delivery_budget` migrations create identical
service-owned `ConsumerDelivery` tables in Inventory, Payment and Order:

```text
(consumer queue, immutable body SHA-256, replayCount) PRIMARY KEY
attempts, createdAt, updatedAt
```

Prisma upsert plus conditional atomic increment (`attempts < maxAttempts`) admits
at most the configured budget across concurrent workers. Claim commits before
business work; business rollback or channel/process loss cannot erase it. No raw
SQL claim primitive, distributed transaction or new Inbox abstraction is added.
Matching successful Inbox is checked first, so a commit-before-ACK duplicate can
still succeed after the final claim. The counter is operational evidence, never
proof of successful processing. Existing domain/provider identities are untouched.

Defaults remain `DEPENDENCY_MAX_ATTEMPTS=3` (two retries), configurable 1..5;
`RETRY_BASE_DELAY_MS=100`, `RETRY_MAX_DELAY_MS=1000`, 50..100% exponential jitter.
Same consumer loop owns both operation invocations and claim admission. Broker
redelivery resumes the remaining budget; it does not multiply another three
attempts by the service loop. Gateway, Order HTTP clients, Payment provider,
Outbox and reconnect ownership remain Phase 11 policy.

If DB accounting is unavailable, business work cannot run. A bounded claim retry
may end in transient quarantine with `attemptsKnown=false`, attempt/retryCount
null. Previously persisted count is not guessed. Operator fixes DB/root cause
before replay. Poison and permanent pre-work failures can report zero claims.

Budget counts admissions, including a crash before work or concurrent deliveries
that later deduplicate. Under contention, a duplicate may conservatively quarantine
while another worker is still committing. After commit, Inbox protects replay.
This favors bounded execution over speculative extra attempts.
Cancellation is checked again after an asynchronous claim, before invoking work;
a shutdown can spend a claim without starting the business handler.

## Quarantine diagnostics and safety

Production checkout subscriptions use existing confirmed publisher to send exact
source bytes to `domain.events.dlx`, routing under the original consumer queue.
Only after confirmation does the consumer ACK source. New application quarantine
copies carry `x-fitsupply-failure` JSON and `x-fitsupply-replay-count` headers;
`x-fitsupply-original-routing-key` preserves logical route after direct replay.

Diagnostic fields include stable quarantine ID, event identity/version, workflow
correlation/causation, producer service where validated, consumer/service, queue,
routing key, attempt/retry count, known-count flag, limit, classification, error
name/code, fixed sanitized explanation and failedAt. Known envelope identity is
retained even when payload/version is poison. Arbitrary event data, original error
message, stack, credentials and authorization headers are not copied into these
diagnostics. Pino retains structured context; terminal checkout error logs also
use sanitized summaries.

Native `x-death` is still produced by legacy/generic NACK-without-requeue paths;
real tests assert queue/reason/count. It does not count ordinary redelivery and
is not this policy's attempt budget. Application confirmed quarantine publication
does not itself create native `x-death`; explicit diagnostics are authoritative.
Legacy DLQ copies without application diagnostics show UNKNOWN cause/count and
can require correlation with existing service/broker logs.

If quarantine publication fails, returns unroutable, or confirmation is unknown,
source stays unacked and delivery channel closes. Broker requeues it; session
readiness fails and Phase 11 reconnect pacing applies. After restart the persisted
budget prevents more business work, while quarantine publication can recover.
Broker/DLX recovery can persist in background; no business-attempt budget resets.
No immediate ordinary transient `nack(..., true)` loop is introduced.

There is a deliberate duplicate window: DLQ publication confirms, then source ACK
is lost. Both source and DLQ may survive. Same body/epoch gives the same quarantine
ID; repeated copies are expected, not exactly-once delivery.

## Operator runbook

Apply migrations and regenerate the three clients before deploying new checkout
workers. Stop old workers when claiming durable budgets: old binaries can still
reset their in-memory retry counts. No queue type/declaration migration or dev-data
reset is required. No new third-party dependency or administrative HTTP service.

Select the intended broker explicitly through `RABBITMQ_URL`; tooling never loads
an env file or silently chooses development/production credentials. Existing
`RABBITMQ_CONNECTION_TIMEOUT_MS` applies. Example PowerShell for disposable tests:

```powershell
$env:RABBITMQ_URL='amqp://fitsupply_test:fitsupply_test@localhost:5673'
npm run dlq -- inspect --queue inventory.order-created.dlq --limit 10
npm run dlq -- replay --queue inventory.order-created.dlq --id <ID> --confirm <ID>
```

Supported queues are the four existing configured `.dlq` names. Inspection defaults
to 10, maximum 100. It uses `basic.get(noAck=false)`, holds all scanned deliveries,
and closes its dedicated channel to requeue them; no inspected message is ACKed.
Inspection may change queue order or temporarily contend with other operators.
Output is metadata only, including replay eligibility and safe recovery guidance.

Quarantine ID is a SHA-256 selector over source queue, replay epoch and body hash.
Identical duplicate copies share a selector. Replay selects one copy, scans at most
100 messages (configurable 1..100), and requeues every unselected delivery. A
message beyond that scan remains quarantined; this command is not bulk draining.
There is no scheduler, automatic replay, discard command or payload editor.
Leaving a message quarantined requires no action; deliberate discard remains an
explicit broker-administration decision outside this nondestructive CLI.

Recovery:

```text
inspect
fix external/root cause; assess business state
explicit replay command with matching ID confirmation
validate unchanged event and target's actual bindings
publish persistent/mandatory to default exchange + original source QUEUE
publisher confirmation
ACK only selected original DLQ delivery
normal consumer path + Inbox/domain protection
```

Direct-to-queue replay avoids rebroadcasting a failed subscriber's event to other
services. Canonical bytes, eventId, correlationId, causationId and data remain
unchanged. Transport replayCount increments; replayedAt and original routing key
are added separately. Confirmed publication means accepted for routing, not that
business recovery has already finished. Verify Saga/Order/Inventory/Payment state
after replay, and inspect DLQ again if it fails.

At most three explicit replays per chain (`MAX_REPLAY_COUNT=3`), each using a new
operator-approved epoch with the same bounded processing budget. Default ceiling
is 3 initial claims + 3 replay epochs x 3 claims = 12 admissions, not an automatic
12-attempt loop. Duplicate copies at one replay epoch share its ledger budget.
Exceeding cap leaves quarantine for deliberate reconciliation/repair; there is no
hidden override or automatic replay. Invalid event contracts/routes cannot replay.

Replay publication failure retains DLQ copy. Confirmation received then lost before
DLQ ACK can leave both copies. SIGINT/SIGTERM aborts selection or prevents ACK after
an in-flight confirm; cleanup closes channel so unacked originals return. Existing
publisher confirm timeout bounds that wait. Inbox/domain/provider keys remain
necessary for duplicate replay and ambiguous outcomes.

## Replay versus repair

Replay is the same logical immutable event and exact original bytes. Dependency
repair can make unchanged event replay succeed. Invalid event contents are a
different case: CLI refuses editing them or publishing a mutated body under the
same ID. Preserve poison evidence in quarantine.

The owning producer/domain must deliberately reconstruct a corrected fact/command
with new eventId, valid producer/contract, appropriate correlation and provenance
(original eventId as causation when valid, otherwise retained quarantine selector
in an explicit repair record/runbook). New eventId alone does not authorize another
stock/financial operation: reconcile previous effects and preserve applicable
domain/provider idempotency boundaries. Phase 12 supplies no event editor, forged
producer utility, automatic repair or generic workflow engine.

## Remaining limits and next boundary

- RabbitMQ remains at-least-once. Confirm/ACK spans a crash window; no distributed
  transaction or exactly-once-delivery claim. Effectively-once business effects
  depend on the existing Inbox and domain/provider protections.
- Attempt claims can be spent without business work; concurrency can conservatively
  quarantine duplicates. Stable bytes define accounting identity; arbitrary new
  producer serialization/identity is not a trusted redelivery policy.
- Replay metadata is an operational contract for trusted broker publishers and
  operators, not a new authorization system. Broker credential/role administration
  remains required. Existing provider/DB atomicity limitations still apply.
- Ledger, Inbox, Outbox and DLQ retention/archival are not automated. Pruning counters
  or receipts changes recovery history and needs a deliberate retention policy.
- No recovery is possible while source/DLX/broker is unavailable; sources remain
  unacked, business budget remains spent and existing reconnect pacing applies.
- No broad metrics/tracing platform, auth/Gateway redesign, production deployment
  infrastructure, payload editor or automatic DLQ repair was added.

See [TESTING.md](../TESTING.md) for exact results. Phase 13 planning can build
observability/runbooks around this lifecycle after roadmap confirmation; Phase 13
implementation is explicitly deferred.
