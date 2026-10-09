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
