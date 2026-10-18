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
