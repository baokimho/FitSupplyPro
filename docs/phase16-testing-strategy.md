# Phase 16 testing strategy

## Pre-change audit (2026-10-25)

Baseline: `3ba4f2b`. Vitest 4, Supertest, native HTTP, Prisma/PostgreSQL and amqplib/RabbitMQ already provide 803 fast-phase, 311 integration and 15 Docker E2E cases. No repository Vitest configuration or CI pipeline exists; root matrix discovers files. Eight disposable databases are migration/drift checked; integration broker uses port 5673, E2E broker 5674 and gateway 3500. Existing builders and guarded cleanup helpers live in shared `testing` directory. Workspaces execute sequentially to avoid shared broker queues; files within a workspace remain isolated/concurrent.

| Guarantee | Primary owner / evidence | Existing coverage | Actual gap |
| --- | --- | --- | --- |
| Validation, lifecycle, money, authorization policy | Fast unit: domain/config/shared schemas | Exhaustive policy matrices | No duplicated policy suite needed |
| HTTP middleware/error contracts | Local HTTP component tests in fast phase | Gateway/services/shared contracts | Workspace commands currently run misleading scopes |
| Disposable DB identity/migrations | Shared infrastructure helpers + prepare-test-dbs | All eight schemas migrated/drift checked | Cleanup lists omit independent operational ledgers |
| Catalog persistence and API | Service integration + PostgreSQL | Only config/probes plus E2E happy path | Missing FK/uniqueness/publication/filter/validation tests |
| Order mutation + Outbox | Order checkout-idempotency integration | Trigger-induced rollback, persisted intent, replay | Already proven; reuse |
| Inventory effect + Inbox + Outbox | Inventory reservation integration | Real receipt rollback, duplicate race, post-commit broker redelivery | Already proven; reuse |
| Financial effect + receipt + Outbox | Payment idempotency integration | Provider acknowledgement, local rollback, stable replay, concurrent commands | Already proven; reuse |
| HTTP idempotency versus event/operation identity | Order/Inventory/Payment integration | Same-key replay/conflict, scope, separate clients, repeated publication | Distinct guarantees already tested |
| Broker delivery, confirms and routing | Shared real RabbitMQ integration | ACK/NACK/DLX/redelivery, negative confirms, queue bindings, prefetch, drain | Several arbitrary sleeps can use explicit signals |
| Durable budget + quarantine/replay | Inventory real DB/broker integration | Persisted attempts, reconnect, poison/permanent, exhausted budget, unconfirmed quarantine | Already proven; reuse |
| Outbox dispatch/recovery/concurrency | Order integration | Marker rollback, recreated publisher, two connections/SKIP LOCKED | Add real process crash after committed root intent in E2E |
| Saga state/compensation | Order integration + async E2E | Persisted transitions, reordered release/refund, repeated compensation, failure repair | No state-machine redesign needed |
| Gateway/Auth trust boundary | Gateway real HTTP + Auth real DB/key files | Header spoofing, canonical paths, Expect, deadlines, JWT/JWKS/refresh/ownership | Existing adversarial matrix sufficient |
| Metrics/logs/trace causality | Shared semantic tests + real OTLP/RabbitMQ + E2E | Internal metrics all nine services, spans/links, outage, sanitized logs, shutdown | No snapshots or duplicate telemetry suites needed |
| Sync checkout | Purchase lifecycle E2E | Success, replay, payment failure/retry/refund, explicit cancellation/release | Missing insufficient-stock checkout E2E |
| Async checkout | Event checkout E2E | Success, decline, stock failure, refund/release, outage/reconnect, DLQ replay | Strengthen existing outage fixture with actual process kill |
| Existing Notification read isolation | E2E single read/foreign ownership | Existing HTTP flow | Missing bulk read persistence isolation; test existing behavior only |
| Timing/order independence | Vitest fixtures, fake timers, explicit confirmations | Most waits bounded | Readiness fetch can hang; no shuffle entry point; pure helper tests mislabeled integration |

Audit intentionally avoids tests at every layer. Existing Cart/Shipping/Notification implementations are not expanded.

## Official pyramid and ownership

```text
                     Few
             +------------------+
             | 4: Checkout E2E  | Real services + DB + broker
             +------------------+
             | 3: Infrastructure| Real PG locks/rollback, RabbitMQ settlement
             +------------------+
             | 2: Component/API | Actual routes/services; controlled externals
             +------------------+
             | 1: Pure unit     | Rules, schemas, state machines, retry decisions
             +------------------+
                     Many
```

Choose lowest layer that can falsify guarantee. State transitions/validation belong to unit tests. SQL atomicity and uniqueness require PostgreSQL. AMQP confirms, routing, ACK/NACK and redelivery require RabbitMQ. Cross-service propagation and complete business journeys belong to E2E. Fakes model external failure at service boundaries; they never substitute for broker/transaction evidence. Existing coverage is retained when another layer proves a different guarantee, not copied to populate matrix columns.

For compatibility, `test:unit` is the **fast phase**: pure unit tests plus local HTTP component tests for components fundamentally requiring HTTP (middleware, proxy adapters, log/context propagation). It never provisions PostgreSQL or RabbitMQ. `.integration.test.ts`/`.integration.spec.ts` files form disposable-infrastructure phase. `tests/e2e/*.e2e.test.ts` run only through E2E runner. Two pure environment/factory helper suites were renamed out of integration. No large-scale test renaming or new testing DSL was needed.

Use `describe` for owned operation/subsystem; case name states condition, action and guarantee. Test names describe observable persisted/protocol results, not incidental method-call sequences. Assert semantic metric deltas/selected span fields, never full payload snapshots.

## Persistence, fixtures and isolation

Integration runner owns Compose project `fitsupply-test-db`, its PostgreSQL volume and RabbitMQ container. It waits for readiness, checks migration drift, deploys all eight services' migrations, supplies dedicated `*_DATABASE_URL` values, runs tests and tears down on success/failure. Database helpers require expected `*_test_db` name and `fitsupply_test` user before cleanup. Never run destructive operations on developer data. E2E has separate project/ports/volume and rebuilds its own service images.

Shared cleanup includes domain tables **and independent** Inbox receipts, Outbox rows, durable delivery attempts, Saga/idempotency records and fake-provider receipts. Order integration verifies this against real tables. No implicit seed dependency: fixture builders create explicit relations and use per-test contexts where deterministic IDs matter. New Catalog API tests reuse existing Category/Brand/Product builders. Existing Notification tests reuse builder and test existing intake/read behavior only.

Auth integration now creates account/token state per test rather than relying on registration case running first. Each case owns fresh application/key cache, Prisma pool and ephemeral HTTP listener; keyring is restored to K1 before each case. Rotation alone controls Date, and hooks restore real timers and close connections afterward. Real DB, signer, token verification, refresh race and key reload semantics remain active. This isolates persisted credentials, cached signing state and transaction lifetimes without sleeps or production reset hooks. Real OTLP collector fixture likewise restores its listener between export/outage cases.

Within a workspace Vitest keeps normal file isolation/concurrency. Migration suites use their existing isolated schemas/clients. Workspace order is sequential because existing broker suites share configured foundation queue names; independent files are not globally serialized. Run only one integration/coverage runner against shared `fitsupply-test-db` project at a time. E2E project can coexist with integration because resources/ports differ.

Broker tests purge only guarded disposable broker queues and close channels/connections. Correlation overlap uses explicit two-consumer barrier. Drain tests observe broker cancellation/round trips rather than arbitrary sleeps. Intentional latency injection remains only where latency itself is tested (timeout/concurrency), under bounded test deadlines. Readiness helper aborts in-flight fetch and races absolute timeout even for an abort-ignoring fake transport. E2E fetch/body and SQL helper calls have explicit deadlines; eventual assertions use bounded polling, not fixed success sleeps.

## Transaction, identity and recovery evidence

* Order integration uses real PostgreSQL triggers to reject Outbox/marker/domain writes, proving rollback and recovery. Two independent clients hold confirmations to prove SKIP LOCKED claims differ. Persisted backlog includes delayed intents.
* Inventory integration proves operationId mutation safety separately from Inbox eventId safety. Receipt failure rolls back mutation and outgoing intent. Closing delivery channel after real DB commit forces actual broker redelivery; effect/receipt/intent remain unique.
* Payment integration proves provider acknowledgement survives local transaction failure, stable provider keys prevent another charge/refund, and financial state/receipt/intent recover atomically. Provider is intentionally fake; production payment-provider integration is not invented.
* Durable delivery tests spend persisted three-attempt budget across recreated consumers/channels, then quarantine with confirm-before-source-ACK. Poison/permanent messages do not waste short retries. No hot requeue loop is used.
* DLQ inspection holds/requeues copies without ACK; explicit replay preserves event bytes/identity, increments bounded replay metadata, publishes only to original queue and confirms before removing DLQ copy. Failed publication retains original. E2E replay passes through normal consumer validation and Inbox/domain deduplication.
* Saga integration asserts persisted RESERVING/PAYING/CONFIRMING/COMPLETED state and refund/release compensation, reordered outcomes, concurrent delivery, already completed steps and repaired failures. E2E asserts terminal business state, not transient timing.
* Async E2E commits root intent while RabbitMQ is offline, verifies persisted row, **SIGKILLs Order**, restores broker and starts new Order process, verifies changed process start timestamp, and waits for one completed Saga/reservation/payment/provider effect without client replay. This strengthens existing recovery fixture rather than adding duplicate journey. Broker audit connection is recreated afterward so outage case need not run last.

Channel-loss tests model post-commit/pre-ACK crash and confirmed-quarantine/pre-source-ACK uncertainty using real broker/persistence. One actual process-kill scenario covers root Outbox recovery. These tests are not claims of exhaustive kill-at-every-instruction coverage.

## API, security and observability

Catalog now has real Express routes/validation/secret middleware + Prisma/PostgreSQL checks for persisted decimal/relation data, publish/filter/unpublish, service conflicts plus database uniqueness, missing references and FK deletion safety. Existing Notification intake, owner-scoped reads, repeated read and bulk-read isolation have real API/DB tests. No service feature was added.

Existing Gateway real HTTP stack owns spoofed identity, allowlisted/hop headers, JWT/role boundaries, canonical paths, body/CORS/rate policies, Expect, deadline, sanitized upstream failures and drain. A cold JWKS lookup is legitimate during signature verification; invalid-token tests assert **no protected business request** rather than assuming JWKS cache already warm. Auth tests retain credential hashing, login normalization, issuer/audience/type/algorithm/expiry, key rotation/cache, refresh reuse/revocation and stateless access lifetime guarantees.

Phase 15 tests own normalized metric labels, committed counters/gauges, Outbox context links, HTTP/RabbitMQ propagation, sanitized log/span fields, real OTLP collector outage and bounded shutdown. HTTP metric assertions now measure delta so preceding telemetry cases cannot change result. Deployed E2E metrics checks still cover all nine services. No telemetry snapshots or duplicate registration resets hide lifecycle behavior.

## E2E fixture contracts

Sync E2E retains success/fulfilment, payment failure and explicit cancellation/release, repeated payment/retry/refund and security journeys. New insufficient-stock case proves no Order/Payment/Inventory side effect and retained cart. Existing failed checkout key stays terminal (409); restock uses fresh key, succeeds once and cancels/releases correctly. No idempotency contract changed.

Reused authenticated users avoid making suite exceed real Auth rate policy. Their carts are cleared through public API before each sync case; checkout selects requested product rather than first cart row. Async cases use unique fixtures, reset per-case audit observations and restore broker connection after outage. Both E2E and matrix support fixed shuffle seeds to expose order dependence. No rate limit, timeout or business assertion was weakened to pass tests.

## Commands and environment

Install lockfile dependencies with `npm ci`. Use Node compatible with current package engines (Docker Node 20 image), npm workspaces and Docker Desktop/Linux containers. Integration needs free localhost ports 55433/5673; E2E needs 3500/5674. Eight DB schemas and broker topology are existing infrastructure, not new Docker/CI/AWS work.

```sh
npm run test:unit                         # fast phase + native runner checks
npm run test:integration                  # disposable PG/RabbitMQ lifecycle
npm test                                  # unit then integration; E2E separate
npm run test:e2e                          # sync, async success, async decline
npm run test:unit --workspace auth-service
npm run test:integration --workspace catalog-service
npm run test:workspace -- @shared/utils
npm test -- --seed 16016                  # files AND cases shuffled reproducibly
npm run test:e2e -- --seed 16016
node scripts/test-matrix.mjs all --list    # read-only inventory; no builds/containers
npm run coverage                          # descriptive per-workspace reports
```

Root and workspace `test`, `test:unit`, `test:integration` delegate to same runner, anchored to script location rather than caller working directory. Workspace `test:e2e` deliberately runs entire stack: E2E is not meaningful as isolated workspace unit command. Shared package builds before test execution, including standalone E2E. Invalid phase/workspace/seed/options fail before mutable setup. Native Node runner checks cover classification, cwd independence, all persistence owners and rejected selections. `--list` provides current file inventory without exposing environment secrets.

Coverage remains diagnostic, with no arbitrary percentages/thresholds. Removed unsupported Vitest 4 `coverage.all`; explicit include/exclude scope remains. Generated clients, tests, dist and test helpers remain excluded. No CI pipeline was introduced. Existing `test:all` remains unit+integration alias; full verification additionally requires explicit E2E, lint, typecheck and build.

## Verification and intentional limits

Executed command results are recorded in `TESTING.md`. Normal integration, focused workspace suites, combined shuffled unit/integration, descriptive coverage and shuffled E2E provide independent and combined evidence. Every workspace's existing tests remain included; no skips/todos were added.

No external live payment processor is claimed: existing fake provider models acknowledgement and idempotent recovery. No pure Notification unit suite is added just to fill column; owned persistence/API behavior has component/E2E coverage. Tests do not exhaustively prove arbitrary network partitions, every process crash location or production-scale load. Shared disposable project is intentionally a single-runner resource. Frontend, CI/CD, Docker hardening, AWS/Kubernetes and Phase 17 are outside scope.
