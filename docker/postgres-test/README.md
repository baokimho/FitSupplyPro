# Disposable PostgreSQL Test Database

Postgres-only environment for backend integration tests. It is isolated from the development Docker stack:

- Compose project: `fitsupply-test-db`
- Container: `fitsupply-postgres-test`
- Volume: `fitsupply-test-db_postgres_test_data`
- Host port: `55433`
- User/password: non-secret local test values, `fitsupply_test` / `fitsupply_test`

## Lifecycle

Start:

```sh
npm run test:db:up
```

This command returns only after Docker Compose reports the PostgreSQL service healthy. The healthcheck connects to all eight expected test databases and runs SQL against each one, so init script completion is part of readiness. If the environment does not become healthy within 60 seconds, the command exits non-zero.

Reset from a clean volume:

```sh
npm run test:db:reset
```

Reset removes the disposable test volume, then delegates to `npm run test:db:up`, so it has the same readiness guarantee.

Stop and remove disposable data:

```sh
npm run test:db:down
```

## Test Databases

Use these `DATABASE_URL` values for Prisma-backed integration tests:

```txt
postgresql://fitsupply_test:fitsupply_test@localhost:55433/auth_test_db
postgresql://fitsupply_test:fitsupply_test@localhost:55433/catalog_test_db
postgresql://fitsupply_test:fitsupply_test@localhost:55433/inventory_test_db
postgresql://fitsupply_test:fitsupply_test@localhost:55433/order_test_db
postgresql://fitsupply_test:fitsupply_test@localhost:55433/cart_test_db
postgresql://fitsupply_test:fitsupply_test@localhost:55433/payment_test_db
postgresql://fitsupply_test:fitsupply_test@localhost:55433/shipping_test_db
postgresql://fitsupply_test:fitsupply_test@localhost:55433/notification_test_db
```

This task only provides disposable PostgreSQL. Service test Compose stacks, shared test helpers, migrations orchestration, factories, coverage configuration, and purchase-flow tests belong to later roadmap tasks.
