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
| `api-gateway` | gap: no unit tests | gap: no integration tests | gap: no tests |
| `auth-service` | gap: no unit tests | gap: no integration tests | gap: no tests |
| `catalog-service` | gap: no unit tests | gap: no integration tests | gap: no tests |
| `inventory-service` | gap: no unit tests | gap: no integration tests | gap: no tests |
| `order-service` | gap: no unit tests | gap: no integration tests | gap: no tests |
| `cart-service` | gap: no unit tests | gap: no integration tests | gap: no tests |
| `payment-service` | gap: no unit tests | gap: no integration tests | gap: no tests |
| `shipping-service` | gap: no unit tests | gap: no integration tests | gap: no tests |
| `notification-service` | gap: no unit tests | gap: no integration tests | gap: no tests |
| `@shared/utils` | gap: no unit tests | `packages/shared/src/testing/*.integration.test.ts` | reports generated |
