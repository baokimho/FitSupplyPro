# Testing

Root test commands are source of truth for this repo. Workspace `test:*` scripts may still contain `--passWithNoTests` during migration, so root matrix invokes Vitest directly with discovered test files.

## Commands

```sh
npm run test:unit
npm run test:integration
npm run test
npm run coverage
npm run test:workspace -- @shared/utils
npm run test:workspace -- packages/shared
```

`npm run test` runs unit phase first, then integration phase. `npm run test:workspace -- <name-or-path>` runs unit tests for one workspace. For integration or coverage targeting, call the matrix directly:

```sh
node scripts/test-matrix.mjs integration --workspace @shared/utils
node scripts/test-matrix.mjs coverage --workspace @shared/utils
```

## Integration Lifecycle

`npm run test:integration` performs:

1. `npm run test:db:config`
2. `npm run test:db:reset`
3. `npm run test:db:prepare`
4. workspace integration tests
5. `npm run test:db:down`

`test:db:reset` removes and recreates only Compose project `fitsupply-test-db`. Readiness waits for PostgreSQL health, and health checks every expected `*_test_db` database. `test:db:prepare` checks migration drift and applies migrations to:

- `auth_test_db`
- `catalog_test_db`
- `inventory_test_db`
- `order_test_db`
- `cart_test_db`
- `payment_test_db`
- `shipping_test_db`
- `notification_test_db`

Teardown runs after setup, test, and failure paths. If tests fail, teardown does not hide original exit code.

Phase 5 adds disposable RabbitMQ to the same integration Compose project. Setup
waits for both PostgreSQL and RabbitMQ health. The matrix supplies
`RABBITMQ_URL=amqp://fitsupply_test:fitsupply_test@localhost:5673`; teardown removes
the test broker without touching development RabbitMQ. Unit tests require no broker.

Focused broker checks, without preparing PostgreSQL schemas:

```powershell
npm run test:db:up
$env:RABBITMQ_URL = 'amqp://fitsupply_test:fitsupply_test@localhost:5673'
npm exec --workspace @shared/utils -- vitest run src/testing/rabbitmq.integration.test.ts
npm run test:db:down
```

Broker tests reject endpoints other than disposable `localhost:5673` with user
`fitsupply_test` and default vhost before queue purges. Run that suite once per
test broker; concurrent instances would share foundation queue names.

## Coverage

`npm run coverage` uses Vitest V8 coverage. It runs DB setup/prepare first because coverage includes integration tests. Reports are per workspace, not aggregated:

- `coverage/<workspace-path-with-dashes>/index.html`
- `coverage/<workspace-path-with-dashes>/coverage-final.json`
- `coverage/<workspace-path-with-dashes>/coverage-summary.json`
- `coverage/<workspace-path-with-dashes>/lcov.info`
- terminal text report
- root index: `coverage/summary.json`

Scope includes handwritten production TypeScript under `src/**/*.ts`. Excluded paths are generated Prisma clients, shared test helpers under `src/testing/**`, test files, build output, and Prisma schema/migration files. No thresholds are enforced yet.

## Current Matrix

| Workspace | Unit | Integration | Coverage |
| --- | --- | --- | --- |
| `api-gateway` | 4 files: config, logger, error contract, probes | 1 file: security/correlation boundaries | available |
| `auth-service` | 7 files: config, logger, keys, auth errors, cleanup, probes, DB cleanup | gap: no integration tests | available |
| `catalog-service` | 4 files: config, logger, probes, DB cleanup | gap: no integration tests | available |
| `inventory-service` | 4 files: config, logger, probes, DB cleanup | 1 file: inventory reservations | available |
| `order-service` | 9 files: config, logger, downstream errors, probes, DB cleanup, lifecycle, creation, payment snapshot | 1 file: checkout idempotency/lifecycle | available |
| `cart-service` | 1 file: error contract | 1 file: cart versioning | available |
| `payment-service` | 4 files: config, lifecycle matrix, probes, downstream errors | 3 files: commands/recovery/races, fake provider, legacy migrations | available |
| `shipping-service` | 1 file: error contract | 1 file: shipping lifecycle | available |
| `notification-service` | gap: no unit tests | gap: no integration tests | gap: no tests |
| `@shared/utils` | 11 files: JWT, config, logging, middleware/errors, correlation, probes, shutdown, broker config/consumer validation | 3 files: test infrastructure/factories, real RabbitMQ mechanics | available |

Phase 1 closeout: 278 unit tests, 92 integration tests, and 3 Docker-backed E2E
tests passed. Existing gaps above remain explicit; the E2E suite exercises all
services. Coverage is available through `npm run coverage`, but coverage reports
were not generated as part of Phase 1 closeout.

Phase 2 closeout: 326 unit, 93 integration, and 4 E2E tests passed. Coverage reports
were not generated. Added checks cover concurrent correlation isolation, proxy/order
propagation, public request ID/CORS exposure, liveness/readiness and probe deadlines,
drain rejection, real HTTP draining, duplicate signals, shutdown deadlines, and owned
Prisma/pool cleanup. Disposable Docker checks verified all five services ready and
clean signal exits. Unscoped service integration gaps above remain explicit.

## Phase 4 closeout

Payment lifecycle/provider/commands and recovery are complete; Phase 5 not started.
See [Payment domain](docs/phase4-payment-domain.md) for guarantees, routes, retry
contract and limitations. All following commands completed successfully:

- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`: **405 passed** across workspaces; Payment **23 passed**.
- `npm run test:integration`: **151 passed**, using disposable Docker PostgreSQL;
  Payment **51 passed** across commands/races/recovery, provider and migration tests.
- `npm run build`: compiled Payment includes generated Prisma runtime in `dist`.
- `npm run test:e2e`: **6 passed** against rebuilt Docker stack through Gateway.
- `docker compose config --quiet`
- `docker compose -p fitsupply-test -f docker-compose.test.yml config --quiet`

## Phase 5 closeout

RabbitMQ fundamentals complete; Phase 6 not started. See
[RabbitMQ fundamentals](docs/phase5-rabbitmq-fundamentals.md). Verification:

- `npm run lint`: passed.
- `npm run typecheck`: passed across all workspaces.
- `npm run test:unit`: **429 passed**; no Docker dependency.
- `npm run test:integration`: **177 passed**, including **26 real RabbitMQ checks**
  and all **151 existing PostgreSQL/service checks**. Test resources torn down.
- `npm run build`: passed across all workspaces.
- `npm run test:e2e`: **6 passed** against rebuilt isolated Docker stack. First
  build hit npm `ECONNRESET` before test execution; retry passed. Stack torn down.
- `docker compose config --quiet`: passed.
- `docker compose -p fitsupply-test-db -f docker-compose.test-db.yml config --quiet`: passed.
- `docker compose -p fitsupply-test -f docker-compose.test.yml config --quiet`: passed.
- `docker compose up -d --wait --wait-timeout 90 rabbitmq`: development broker healthy.
- `git diff --check`: passed; Phase 5 diff reviewed for scope.

Broker checks cover all exact bindings, queue isolation, repeated topology setup,
positive/negative confirms, mandatory unroutable returns, publish failure,
post-processing ACK, NACK with/without requeue, each queue's DLQ, prefetch capacity,
correlation isolation, connect/topology failures, resource close, publisher drain,
consumer drain timeout and existing HTTP shutdown hooks. HTTP checkout/inventory/
payment behavior remains unchanged. Existing dedicated service coverage gaps remain
documented above.

Targeted Payment unit/integration runs also passed at every subphase. Failure-window
tests inject real PostgreSQL write errors after provider acknowledgement and retry
through separate Prisma connections. Tests verify duplicate success/failure/refund,
provider decline/errors, lost responses, immutable failed attempts, atomic create,
authoritative amount/ownership, Order convergence and preserved causal errors.
Migration test upgrades legacy PAID/CANCELLED records and durable replay bodies.
E2E includes fresh attempt after failure and duplicate success/refund with unchanged
Order lifecycle after refund. Payment readiness, config, shared secret/correlation
and Gateway role/internal-route boundaries are covered.

Existing gaps: Notification unit tests; Auth/Catalog/Notification integration tests.
The matrix reports these as gaps, not passing suites. Coverage reports were not
generated during Phase 4. No environment-only verification failures remain.

## Phase 6 closeout

Integration event foundation complete. No HTTP workflow, broker topology, business
producer/consumer, Saga or Outbox changed. See
[Integration event contracts](docs/phase6-integration-events.md) for schemas,
payload meaning, identifiers, compatibility and decoding/error semantics.

Added **213 tests** across three shared event test files: envelope validation,
all 11 V1 business contracts, required fields, UUID/quantity/money constraints,
producer ownership, additive-field compatibility, registry uniqueness, TypeScript
discriminator narrowing, metadata creation/propagation, round trips for every
event, malformed UTF-8/JSON, unsupported/unknown contracts and output validation.

Verified on 2026-10-11:

- `npm exec --workspace @shared/utils -- vitest run src/events`: **213 passed**.
- `npm run lint`: passed.
- `npm run typecheck`: passed across all workspaces.
- Explicit `tsc --noEmit` command in event documentation: passed; test type
  assertions compile, including event-specific payload narrowing.
- `npm run test`: **642 unit**, **177 integration** tests passed. Integration
  includes real disposable RabbitMQ delivery checks and PostgreSQL service tests;
  matrix runs both unit and integration workflows and tears down test resources.
- `npm run build`: passed across all workspaces.
- `npm run test:e2e`: **6 passed**, rebuilt disposable Docker HTTP purchase stack;
  stack and test volume torn down.
- `docker compose config --quiet`: passed.
- `docker compose -p fitsupply-test-db -f docker-compose.test-db.yml config --quiet`: passed.
- `docker compose -p fitsupply-e2e -f docker-compose.test.yml config --quiet`: passed.
- `git diff --check`: passed; reviewed diff contains only shared event foundation,
  its exports/tests and documentation. No dependencies added.

Docker Desktop initially was stopped; background startup enabled all Docker checks.
Existing test coverage gaps remain reported by the matrix, not marked as passing
suites. Coverage reports were not generated for Phase 6. Contract foundation is
ready for Phase 7 design/implementation; no asynchronous checkout migration exists.

## Phase 7 closeout

Feature-gated asynchronous checkout complete; default synchronous flow remains.
See [Event-driven checkout](docs/phase7-event-driven-checkout.md) for workflow map,
routing, pending API semantics, deterministic keys, transaction/replay boundaries,
compensation, retry/DLQ policy and remaining DB/broker atomicity gaps.

Verified on 2026-10-11:

- `npm run lint`: passed.
- `npm run typecheck`: passed across all workspaces.
- `npm run test`: **651 unit**, **198 integration** passed. Includes all 213 Phase 6
  contracts and real disposable RabbitMQ/PostgreSQL checks; resources torn down.
- `node scripts/test-matrix.mjs all --workspace order-service`: **83 unit**,
  **44 integration** passed after sharing lifecycle persistence with async outcomes.
- `npm run build`: passed across all workspaces.
- `npm run test:e2e`: **10 passed** across three rebuilt disposable stacks:
  **6 synchronous**, **2 async success**, **2 async decline/compensation**. Each
  async mode also verifies Inventory failure without Payment creation. Bounded
  polling checks eventual state, complete correlation/causation chains, duplicate
  deliveries, reserve/release/provider effect counts and no valid-flow DLQs.
- Explicit strict `tsc --noEmit` for Phase 6 event tests, new checkout boundary test
  and async E2E test: passed.
- `docker compose config --quiet`: passed.
- `docker compose -p fitsupply-test-db -f docker-compose.test-db.yml config --quiet`: passed.
- `docker compose -p fitsupply-e2e -f docker-compose.test.yml config --quiet`: passed.
- `git diff --check`: passed; source/generated-client diff reviewed for scope.

New tests cover concurrent/duplicate reservations, stable outgoing events after
publish failure, whole-batch stock rollback, missing Inventory, duplicate release,
payload mismatch, pending root acceptance/republication, conflicting late outcomes,
automatic provider success/decline, financial commit before receipt failure,
readiness, poison-event DLQs, bounded transient attempts and publisher-confirm drain
during graceful shutdown. Existing broker tests expand to the new bindings. No test
was weakened or disabled. Existing matrix coverage gaps remain explicit; coverage
reports were not generated. No development data reset, Outbox, Saga framework,
notification/shipping migration or push was performed.

Additive schema migrations introduce per-service incoming receipts and Order's
durable async mode/root event. Prisma clients regenerated under the repository's
existing checked-in-client convention; only new generated comment whitespace was
normalized for diff checks. A later generation may restore generator formatting.

## Phase 8 closeout

Order-owned durable checkout Saga complete. See
[Checkout Saga](docs/phase8-checkout-saga.md) for states, compensation policy,
concurrency, migration/rollout, query, DLQ recovery and Phase 9 publication limits.

Verified on 2026-10-12:

- `npm run lint`: passed.
- `npm run typecheck`: passed across all workspaces.
- `npm run build`: passed across all workspaces; Order Prisma client regenerated.
- `npm run test`: **696 unit**, **214 integration** passed; disposable PostgreSQL
  and RabbitMQ resources torn down. Order: **99 unit**, **52 integration**;
  Inventory: **29 integration**; Payment: **56 integration**. Full Phase 0-7
  regression retained; no test weakened, skipped or removed.
- `npm run test:e2e`: **11 passed** across rebuilt disposable stacks:
  **6 synchronous**, **3 async success/refund**, **2 async decline**. Both async
  modes also verify inventory failure without Payment creation. Stock/financial
  effect counts, correlation/causation, Saga terminal state and duplicate replay
  assertions pass. Test stacks and volumes torn down.
- Strict `tsc --noEmit --strict --skipLibCheck --target ES2022 --module NodeNext
  --moduleResolution NodeNext --esModuleInterop` over Saga policy tests, Saga
  migration upgrade test, shared contract tests and async E2E test: passed.
- `docker compose config --quiet`: passed.
- `docker compose -p fitsupply-test-db -f docker-compose.test-db.yml config --quiet`: passed.
- `docker compose -p fitsupply-e2e -f docker-compose.test.yml config --quiet`: passed.
- Fresh disposable database migration deployment and Prisma drift checks: passed
  for all services. Upgrade test applies real migration chain to Phase 7 fixtures;
  verifies conservative legacy backfill, synchronous exclusion and unique Saga.
- `git diff --check`: passed; source, generated-client and documentation diff
  reviewed for scope. Only new generated comment whitespace normalized.

New coverage distinguishes delivery receipts from Saga progress and business
idempotency; exercises transient SQL confirmation failure with paid progress
preserved before receipt, changed pending-event fingerprint rejection, duplicate
and stale events, separate-connection success/failure races, cancellation race,
refund/release ordering, permanent compensation diagnosis/repaired replay and
unreconcilable cash conflict. Real SQL triggers interrupt stock release and refund
receipt persistence; same-key retries converge to one business/provider effect.
Real broker test verifies permanent compensation source reaches its service DLQ
while diagnosis reaches coordinator. Docker E2E crash snapshot proves acknowledged
payment compensation performs one refund and one release across service boundaries.

Initial failures exposed a missing async audit binding, late success after failed
reservation and PostgreSQL enum transaction handling in upgrade backfill; fixed
and verification rerun. Docker access required execution outside filesystem
sandbox. No development data reset, dependency, generic Saga framework, Outbox,
automatic DLQ drain, production deployment or push. Existing matrix coverage gaps
remain explicit; coverage reports were not generated. Phase 9 still owns durable
DB-to-broker publication scheduling.

## Phase 9 closeout

Transactional Outbox complete for Order, Inventory and Payment. See
[Transactional Outbox](docs/phase9-transactional-outbox.md) for producer audit,
atomic boundaries, dispatcher locks/confirms, reconnection, rollout and limits.

Verified on 2026-10-13:

- `npm run lint`: passed; no separate formatter configured.
- `npm run typecheck`: passed across all workspaces.
- `npm run build`: passed across all workspaces. Three Prisma clients regenerated
  with existing checked-in-client convention; new generated comment whitespace
  normalized for diff checks, as in previous phases.
- `npm run test`: **700 unit**, **220 integration** passed. Includes all existing
  RabbitMQ and service regression suites; disposable DB/broker resources torn down.
  Order: **99 unit / 57 integration**; Inventory: **29 integration**;
  Payment: **57 integration**; shared: **477 unit / 53 integration**.
- `npm run test:e2e`: **12 passed**: **6 synchronous**, **4 async success/recovery**,
  **2 async decline** across rebuilt disposable Docker stacks; stacks/volumes removed.
- Explicit strict `tsc --noEmit --strict --skipLibCheck --target ES2022 --module
  NodeNext --moduleResolution NodeNext --esModuleInterop` over new Outbox unit tests,
  changed Order/Inventory/Payment integration tests, migration upgrade tests and
  async E2E tests: passed. Payment middleware included for its existing Express
  Request declaration; standalone invocation initially omitted that declaration.
- `docker compose config --quiet`: passed.
- `docker compose -p fitsupply-test-db -f docker-compose.test-db.yml config --quiet`: passed.
- `docker compose -p fitsupply-e2e -f docker-compose.test.yml config --quiet`: passed.
- Fresh migrations and Prisma migration/schema drift checks: passed across all
  service databases. Upgrade test verifies retained Phase 8 root/receipt envelopes
  enter pending Outbox with original IDs and unchanged Order status.
- `git diff --check`: passed. Reviewed source/generated-client/doc scope; no
  dependencies, new environment settings or unrelated service changes.

New focused coverage:

- Atomic Saga progress/next-event intent and rollback on real Outbox insertion failure.
- Pending Saga intent survives publication error, records attempt/backoff and drains
  through recreated publisher without client replay.
- Real SQL published-marker failure after simulated confirm republishes identical
  event ID; real receipt and guarded Order transition allow one downstream effect.
- Separate PostgreSQL publisher connections hold distinct SKIP LOCKED claims until
  confirmations settle; marker cannot appear before confirmation.
- Financial Outbox insertion failure rolls back Payment outcome; existing provider
  acknowledgement/key lets retry commit result and intent with one charge.
- Existing financial/refund receipt-crash tests now assert Outbox intent survives
  receipt rollback and retains original event identity on retry.
- Inventory reserve/failure/release tests assert durable unpublished outputs.
- Unit checks enforce event/key identity, stop polling timers, and drain in-flight
  confirmation/marker before closing.
- Docker E2E stops only disposable RabbitMQ, accepts Order/Saga/root intent while
  offline, restarts broker and proves automatic checkout convergence with one stock
  reservation and one provider settlement. No same-key HTTP/source replay needed.
- Docker success/decline cases simulate confirm-before-marker window by clearing
  only test Outbox published marker; retry retains event ID and effect counts.

Docker Desktop initially was stopped and started in background. First verification
also exposed service Date-versus-wire-string comparison and old duplicate-terminal
publication expectation; tests now compare HTTP JSON form and explicitly exercise
Outbox marker replay. Test variable collision fixed; final checks rerun. No tests
weakened/disabled, development reset, Inbox, CDC, Kafka, Notification/Shipping
migration, deployment or push. Existing coverage gaps remain explicit; no coverage
report generated. At-least-once publication remains intentional; provider atomicity,
business DLQ repair, retention/backlog operations and global ordering remain limits.

## Phase 10 closeout

Transactional Inbox complete for live Order, Inventory and Payment checkout
consumers. See [Phase 10 audit and architecture](docs/phase10-idempotency.md).
Existing `CheckoutEvent` evolved additively; no parallel deduplication table.
HTTP idempotency audit required no implementation rewrite.

Verified on 2026-10-18:

- `npm run test:unit`: **700 passed** across all workspaces with existing tests.
- `npm run test:integration`: **229 passed**, including real PostgreSQL and
  RabbitMQ tests. Inventory **33**, Order **61**, Payment **58**, shared **53**;
  other existing service suites passed. Disposable DB/broker resources removed.
- `npm run test:e2e`: **12 passed** across rebuilt Docker stacks: **6 synchronous**,
  **4 async success/recovery**, **2 async decline**. Includes source duplicates,
  compensation, provider effect counts and broker-outage/Outbox recovery.
  Disposable E2E resources removed.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed across workspaces.
- `npm exec --workspace <service> -- prisma generate` and `prisma validate`:
  passed for Order, Inventory and Payment. Existing `driverAdapters` deprecation
  warning retained; no unrelated Prisma configuration change.
- Integration preparation applied migrations to fresh test databases and checked
  migration/schema drift across all service databases: passed.
- `docker compose config --quiet`, test DB Compose config, E2E Compose config:
  passed. No development data reset.
- `git diff --check f700600`: passed. Generated clients retained; only newly
  generated comment whitespace normalized while preserving existing content.

New/strengthened guarantees tested:

- Inbox primary-key duplicate rejection; incoming type and timestamp persistence.
- Concurrent source deliveries stage one stock mutation, receipt and output intent.
- Three additive migration upgrade tests preserve old receipt fingerprint/result
  and uniqueness, including null results and unknown historical event type.
- Actual RabbitMQ channel loss after PostgreSQL commit but before ACK requeues
  delivery. A real consumer detects duplicate, ACKs, and retains one reservation,
  InventoryOperation, Inbox row and outgoing event.
- Real receipt-insert trigger failure rolls back stock, operation and Outbox;
  repaired source replay executes successfully.
- Payment receipt failure now rolls back final financial outcome and Outbox;
  independent provider receipt and stable payment identity recover one charge or
  refund. Existing financial Outbox-failure tests remain passing.
- Independent Payment clients race duplicate refunds and retain one provider
  refund, transition, receipt and intent.
- Concurrent Order Saga outcomes preserve refund/release failure recovery and
  completion; same-event replay adds no Outbox intent or further Saga transition.
- Existing HTTP changed-input, cross-instance replay, failed-attempt, compensation,
  provider recovery, Saga recovery and Outbox recovery regression suites pass.

Existing test gaps remain: no dedicated Auth/Catalog/Notification integration
suites and no Notification unit suite. Their existing E2E coverage is unchanged.
At-least-once delivery, external provider atomicity, independent financial
preparation, failure diagnostics, retention, DLQ repair and global ordering remain
explicit limitations; see architecture document. No Phase 11 work or pushes.

## Phase 11 verification

Completed 2026-10-19. See [Failure handling and resilience](docs/phase11-resilience.md)
for baseline audit, actual timeout/retry matrices, ownership and limitations.
Circuit breaker intentionally omitted; no measured dependency saturation or
external network provider justified adding circuit state.

Final checks:

- `npm run test:unit`: **724 passed** (including **500 shared**); all existing
  workspace suites passed. Notification's pre-existing unit coverage gap remains.
- `npm run test:integration`: **236 passed**: Gateway **15**, Inventory **35**,
  Order **64**, Cart **2**, Payment **59**, Shipping **7**, shared **54**.
  Real PostgreSQL/RabbitMQ/HTTP tests included; disposable DB/broker torn down.
- `npm run test:e2e`: **12 passed** across rebuilt isolated Docker stacks:
  **6 synchronous**, **4 async success/recovery**, **2 async decline**. Includes
  compensation, duplicates, provider effect counts and broker/Outbox recovery.
  Disposable E2E containers/network/volume removed.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed across workspaces.
- `npm exec --workspace <service> -- prisma validate`: all eight service schemas
  valid. No Prisma/schema changes or new migrations; client regeneration unnecessary.
  Integration preparation still applies fresh migrations and verifies drift.
- Development, test DB and E2E `docker compose ... config --quiet`: passed.
- `git diff --check 470c5d0`: passed; reviewed scoped source/config/tests/docs.

High-value coverage:

- Explicit failure taxonomy; wrapped HTTP 500 is not turned into retryable 503.
  Permanent validation/business/identity failures and unknown errors stop immediately.
- Deterministic exponential/capped jitter delays, attempt limits, correlation
  preservation, exhaustion logs and 20 concurrent failed operations bounded to
  60 total calls. Fake timers avoid sleeping through backoff.
- Deadline covers HTTP response body, not only headers; abort signal reaches fetch,
  timers/listeners cleared; cancellation stays distinct from dependency timeout.
- Real HTTP server stalls first body, client aborts and safe second read succeeds;
  trace headers unchanged and abandoned socket closes.
- Real Inventory HTTP/DB mutation commits before response stalls. Retry retains
  original operationId: one stock effect and one InventoryOperation persist.
- Checkout Catalog transient failure recovers; same client key replays one Order.
  Insufficient Inventory is attempted once. Exhausted lost reserve responses retain
  uncertain operation identity and same-key compensation releases once.
- Actual PostgreSQL serialization fault on first Inventory update rolls back.
  Real RabbitMQ consumer retries same eventId, ACKs successful work, and duplicate
  delivery leaves one stock/Inbox/Outbox effect.
- Provider commits independent acknowledgement then times out; Payment final
  transition/Inbox/Outbox roll back. Replay uses identical provider input/key and
  records one charge, one receipt and one output intent.
- Existing malformed/permanent-message tests retain DLX/no-hot-requeue policy.
  Actual shutdown interrupts 60-second backoff, makes no second attempt, requeues
  unsettled RabbitMQ delivery instead of dead-lettering, drains broker then DB.
- Existing Saga, Inbox, Outbox, compensation, provider recovery and HTTP replay
  suites pass unchanged except assertions explicitly checking new bounded attempts,
  cancellation signals and classified error-cause chain.

Initial regression caught missing required `reason` in new real-HTTP fixture and
old compensation test's single-attempt expectation. Fixed fixture; strengthened
test to require three bounded attempts sharing one operationId and original error.
No tests skipped, weakened or disabled. Existing Prisma preview and test-runner
shell deprecation warnings remain; no unrelated configuration changes.

No circuit breaker, Phase 12 DLQ tooling, deployment, pushes, new dependencies,
schema migrations or async-by-default change. Existing Auth/Catalog/Notification
integration coverage gaps remain explicit.

## Phase 12 verification

Verified 2026-10-21. See [DLQ recovery and replay](docs/phase12-dlq-recovery.md)
for baseline audit, durable accounting, operator commands and limitations.

- `npm run test:unit`: **731 passed**, including **507 shared**. Existing workspace
  tests pass; Notification's pre-existing unit-test gap remains explicit.
- `npm run test:integration`: **251 passed**: Gateway **15**, Inventory **44**,
  Order **64**, Cart **2**, Payment **59**, Shipping **7**, shared **60**.
  Disposable PostgreSQL/RabbitMQ resources removed after suite completion.
- `npm run test:e2e`: **12 passed**: **6 synchronous**, **4 async success/recovery**,
  **2 async decline**. Completed-checkout scenarios now replay duplicate DLQ facts
  through Inventory, Payment and Order, wait for real broker ACKs and verify stable
  stock, financial effects, Order state and Outbox counts. Disposable E2E resources
  removed after rebuilt stacks completed.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed across workspaces.
- Strict standalone TypeScript check of changed async checkout E2E file: passed.
- Prisma generation: Order, Inventory, Payment clients regenerated using existing
  checked-in convention. All eight service schemas validate. Fresh migration
  deployment and migration/schema drift checks pass through integration setup.
- Development, test DB and E2E Compose configuration checks: passed.
- `git diff --check 03b253a`: passed. No new dependencies or queue-type changes.
- `npm run dlq -- inspect --queue inventory.order-created.dlq --limit 2`: real
  disposable-broker CLI smoke passed; returned sanitized diagnostic metadata and
  retained quarantine copy. Inspection/replay lower-level tests use real broker.

Focused recovery coverage:

- Three failure classes align with Phase 11; poison/business failures do not waste
  retry budget. Operational error messages and bodies are not echoed as diagnostics.
  Unavailable accounting reports unknown count rather than fabricating a number.
- Eight concurrent real DB claims admit exactly three attempts. Claim evidence
  survives business rollback/channel redelivery; remaining budget is resumed.
- Real transient failures succeed within budget. Exhaustion reaches DLQ with
  identity, route, classification, attempt limit and sanitized cause metadata.
- Poison/wrong-handler messages quarantine with no business invocation and cannot
  be blindly replayed. Native `x-death` queue/reason/count remains verified.
- Committed Inbox duplicate ACKs even after final durable claim was spent; stock
  and outgoing intent remain single. Two operator replays retain one business
  effect and one output intent.
- Missing DLX/unconfirmed quarantine closes source channel without ACK; source
  survives and recreated consumer quarantines without resetting exhausted budget.
- Inspection holds scanned copies unacked, requeues on close, obeys max scan and
  never emits arbitrary private bodies/headers/error text.
- Confirmed replay preserves exact bytes/event identity, targets original queue
  without other-subscriber fanout, then ACKs only selected DLQ copy.
- Unroutable replay publish retains original. Lost-confirmation and shutdown before
  DLQ ACK retain original even when replay copy already exists. Replay cap and
  explicit matching confirmation prevent uncontrolled draining/replay loops.
- Existing shutdown, Saga compensation, HTTP/domain/provider idempotency, Inbox,
  Outbox and timeout/backoff recovery regression suites continue passing.
- Cancellation after durable claim but before handler invocation prevents business
  work and failure publication; spent claim remains conservative operational evidence.

Lint initially found CLI AbortController/DOMException globals missing from JS lint
environment; qualified through globalThis and reran successfully. No assertions
weakened, tests skipped, type suppressions, development data reset or pushes.
New E2E setup initially exceeded existing auth registration limit. Replay assertions
were folded into the existing completed-checkout scenario, reusing its fixture;
all replay assertions and production rate limits were preserved.
Existing Prisma preview/test-runner shell deprecation warnings remain.

Reliability remains at-least-once delivery with idempotent protected effects.
Duplicate quarantine/replay copies are expected crash outcomes; no exactly-once
delivery claim. Retention, authorization infrastructure, broad observability and
Phase 13 work remain deferred. Existing service coverage gaps remain documented.

## Phase 13 verification

Verified 2026-10-22. See [API Gateway hardening](docs/phase13-api-gateway-hardening.md)
for baseline audit, forwarding rules, configuration, failure semantics and limits.

- `npm run test:unit`: **742 passed**, including Gateway **35** and shared **507**.
- `npm run test:integration`: **283 passed**: Gateway **47**, Inventory **44**,
  Order **64**, Cart **2**, Payment **59**, Shipping **7**, shared **60**.
  Real disposable PostgreSQL/RabbitMQ, fresh migrations and drift checks pass;
  test containers, volume and network are removed by the runner.
- `npm run test:e2e`: **12 passed**: synchronous **6**, async success/recovery **4**,
  async decline **2**. Existing JWT/JWKS, purchase lifecycle, broker outage,
  Inbox/Outbox, financial idempotency and targeted DLQ replay assertions remain.
- `npm run typecheck`, `npm run lint`, `npm run build`: pass across workspaces.
- Development, test DB and E2E Compose configuration checks pass.
- `git diff --check ad7453b`: passes. No new dependencies or schema changes.

Gateway integration includes **32** new real-HTTP boundary cases, alongside the
existing **15** security integration cases. Tests use actual RS256 signatures,
HTTP JWKS loading/cache, Express app factory, proxy library and local upstreams.
Coverage includes identity spoofing, Authorization parsing/expiry, exact JSON
bytes, chunked oversize, invalid UTF-8/JSON, content type/encoding, CORS, security
headers, malformed/absolute URLs, encoded route authorization, internal-path
casing, unknown routes, refused connections, DNS, reset, malformed HTTP response,
hang, trickling response deadline, native conflicting-framing rejection,
socket-IP limiter spoof resistance, probes and accepted-request SIGTERM drain.
An Expect: 100-continue regression verifies the installed proxy library cannot
skip sanitization, buffered body forwarding or deadline hooks. Safe operational
logs and correlation headers are asserted without matching formatted log lines.
Existing eight-proxy unit contracts now check shared 502 normalization and safe
diagnostics; configuration tests cover budgets and explicit production origins.

Issues found during verification were corrected without weakening assertions:
incoming socket timeout raced JSON 504; no-Origin clients lost existing response
header exposure; Supertest serialized an invalid-byte Buffer rather than sending
raw bytes; shutdown fixture reused a keep-alive connection. Raw HTTP fixtures and
explicit connection close now exercise the intended behaviors. A narrow process
signal test-double cast matches the existing shutdown test pattern; no any or
TypeScript suppression was added. Installed http-proxy's util._extend and existing
Prisma/test-runner deprecation warnings remain. Final shell invocations capture
native npm exit codes explicitly, avoiding Windows PowerShell treating ordinary
Docker/Prisma stderr progress as command failure.

Pre-existing coverage gaps remain: Notification has no unit suite; Auth, Catalog
and Notification have no dedicated integration suites. Real Auth/Gateway behavior
also runs through checkout E2E. This phase adds no Auth redesign, tracing,
distributed limiter, deployment infrastructure, or push.

## Phase 14 verification

Verified 2026-10-23. See [Auth improvements](docs/phase14-auth-improvements.md)
for baseline audit, credential/token contracts, rotation and coordinated rollout.

- `npm run test:unit`: **791 passed**: Gateway **35**, Auth **44**, Catalog **14**,
  Inventory **15**, Order **99**, Cart **11**, Payment **25**, Shipping **2**,
  shared **546**. Notification's existing unit gap remains.
- `npm run test:integration`: **299 passed**: Gateway **48**, Auth **15**,
  Inventory **44**, Order **64**, Cart **2**, Payment **59**, Shipping **7**,
  shared **60**. New Auth suite uses actual PostgreSQL and HTTP JWKS; existing
  broker/Inbox/Outbox/Saga integration remains. Fresh migrations and schema-drift
  checks pass through isolated DB setup; no schema migration was needed here.
- `npm run test:e2e`: **12 passed**: synchronous **6**, async success/recovery **4**,
  async decline **2**. Real Auth issuance/JWKS/Gateway, checkout, correlation,
  broker outage and DLQ replay regression assertions remain intact.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed across workspaces.
- Development, integration DB and E2E Compose configuration checks pass.
- `git diff --check 498fbce`: passes. No dependencies or generated schema changes.
- Disposable test DB/broker/E2E containers, volumes and networks are removed;
  temporary test keyring files are deleted by Auth test teardown.

Security coverage includes strict typed/required claims and lifetimes, expiry,
issuer/audience/algorithm, malformed/missing/unknown kid, wrong key, changed payload
and signature, ignored attacker jku/embedded keys, UTF-8 byte-size JWKS budget,
public-only keys, pair matching, cache single-flight/cooldown and bounded stale
fallback. Gateway HTTP lifecycle tests prove K1/K2 overlap, spoofed identity
replacement, unknown-kid refresh bounds, outage 503 and retired-key rejection.
Auth HTTP/DB tests rotate a live atomic keyring file, resolve actual kid through
HTTP JWKS, advance beyond K1's refresh lifetime, and retire K1 without replacing
the signer/loader processes. Credential tests cover salted current/legacy scrypt,
password policy, role injection, generic failures, normalized identifiers,
duplicate DB races, registration rollback, concurrent refresh reuse, logout races,
persisted logout failure, reuse-evidence retention and stateless role freshness.
Expired logout credentials cannot revoke a newer active refresh session.

During implementation, shared regression tests caught an overly broad JOSE-error
classifier: retained infrastructure errors' previous semantics instead of mapping
every JOSE failure to 401. Test module resets required checking the matching
ServiceUnavailableError constructor; strict token fixtures now include kid, jti,
iat, role and type. A typed mock assertion fixed the compiler's empty-call-tuple
error without suppression. Logout-failure fixture creates an active token before
installing its DB trigger, so a real update fails. No assertions were weakened,
skipped or deleted. Native npm exit codes are captured explicitly on Windows.
Existing Prisma/http-proxy/test-runner deprecation warnings remain.

Coverage gaps remain explicit for Catalog and Notification dedicated integration
and Notification unit tests. No Phase 15 observability or Phase 16 testing-strategy
project was started. No development data was reset; nothing was pushed.

## Phase 14 revised ownership/boundary verification

Verified 2026-10-24 from existing Phase 14 baseline `8fddc1c`. Revised
P14.1–P14.20 audit preserved production code and added missing proof, rather than
reimplementing credential, JWT/JWKS or refresh/logout behavior.

- `npm run test:unit`: **791 passed**; Auth **44**, Gateway **35**, shared **546**.
- `npm run test:integration`: **306 passed**: Gateway **55**, Auth **15**,
  Inventory **44**, Order **64**, Cart **2**, Payment **59**, Shipping **7**,
  shared **60**. Fresh test migrations/drift checks and broker regressions pass.
- `npm run test:e2e`: **13 passed**: sync **7**, async success/recovery **4**,
  async decline **2**. All existing lifecycle, Saga, Inbox/Outbox, retry budget,
  DLQ, correlation and idempotency assertions remain.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed.
- Strict standalone check of changed E2E source passed with explicit Node types:
  `npm exec -- tsc --noEmit --strict --skipLibCheck --target ES2022 --module NodeNext --moduleResolution NodeNext --esModuleInterop --types node tests/e2e/purchase-lifecycle.e2e.test.ts`.
- `git diff --check 8fddc1c`: passed. No production code, dependency, schema,
  service, Docker/CI/deployment or observability changes.

Gateway boundary file now has **39** real-HTTP cases. Seven added parameter cases
use actual signed tokens with wrong issuer/audience, forged signature, unexpected
algorithm, invalid subject type, missing kid, and refresh type on an access route.
Every case returns 401 with shared envelope/correlation and leaves upstream request
count unchanged. Existing valid identity propagation, expired/malformed/missing
tokens, spoof stripping, JWKS rotation/outage and shutdown tests are retained.

Running-stack ownership proof reuses existing Auth customer fixtures and actual
resource IDs. Anonymous spoofed headers cannot read an Order; a foreign JWT plus
owner/admin spoofing cannot cancel it; owner read still succeeds with PENDING
state intact. Foreign Payment reads/creation/confirmation and Shipment reads/
updates are denied, with original state intact and foreign lists excluding those
resources. Foreign Notification mark-read cannot change unread state, while owner
mark-read succeeds. Cart update/delete returns 404 for a foreign item and leaves
quantity unchanged; spoofed Cart GET remains scoped to requester; owner update/
delete succeeds. No fake demonstration routes or new user fixtures were needed.

Existing authorization rules held; no runtime IDOR defect was demonstrated. Test
and documentation changes only. Disposable DB/broker/E2E resources are torn down
by existing runners; no development data reset. Existing deprecation warnings
remain. Phases 15 and later work remain deferred; nothing was pushed.
## Phase 15 observability verification (2026-10-24)

Phase 15 adds behavior tests for route cardinality/statuses, runtime metrics/internal access, module reload, log correlation, HTTP parent-child spans, actual RabbitMQ transport propagation, persisted Outbox context/links and commit failure, durable backlog age, duplicate/rollback accounting, retry/DLQ/replay metrics, real OTLP HTTP export/backend outage, and bounded telemetry shutdown.

Final regression matrix:

| Check | Result |
| --- | --- |
| `npm run test:unit` | 803 passed: Gateway 35, Auth 44, Catalog 14, Inventory 15, Order 99, Cart 11, Payment 25, Shipping 2, shared 558 |
| `npm run test:integration` | 311 passed: Gateway 56, Auth 15, Inventory 44, Order 65, Cart 2, Payment 59, Shipping 7, shared 63 |
| `npm run test:e2e` | 15 passed: sync 7, async success/recovery 5, async decline 3 |
| `npm run typecheck`, `npm run lint`, `npm run build` | Passed |
| Strict standalone TypeScript check of new shared telemetry tests and async E2E | Passed (ES2023, NodeNext, node types) |
| `git diff --check` | Passed |

Async E2E asserts internal authorization and exact service identity for metrics on all nine deployed services, plus nonempty persisted and transported W3C context through every committed event in success/compensation flows, alongside unchanged identity, deduplication and recovery checks. Real OTLP test receives JSON spans, checks sanitized error events, closes collector and proves application work remains healthy. Disposable PostgreSQL/RabbitMQ resources are removed by existing runners. No development databases or volumes are reset.

Initial Docker BuildKit lease failure was transient. Subsequent runtime check found Auth multi-stage image omitted nested shared dependencies; image now includes these dependencies. Final matrix uses corrected runtime packaging. Existing suite gaps remain: Notification has no standalone unit suite; Catalog/Notification have no dedicated integration suite, but Docker E2E exercises them.
