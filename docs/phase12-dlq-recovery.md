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
