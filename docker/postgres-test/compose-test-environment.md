# Docker Compose Test Environment

Isolated backend stack for integration tests. It runs every backend service against disposable PostgreSQL test databases.

- Compose project: `fitsupply-test`
- PostgreSQL container: `fitsupply-stack-postgres-test`
- PostgreSQL volume: `fitsupply-test_postgres_stack_test_data`
- API gateway host port: `3500`
- Service containers: `fitsupply-stack-*-test`
- Test secret: non-secret local value, `fitsupply_test_internal_secret`

## Lifecycle

Validate config:

```sh
npm run test:stack:config
```

Start stack:

```sh
npm run test:stack:up
```

This command builds the test images and returns only after Docker Compose reports all services healthy, or exits non-zero after 120 seconds. Service healthchecks call `/health`; internal services include the required `x-internal-secret` header. PostgreSQL readiness uses the same eight-database SQL healthcheck pattern as the disposable DB-only environment.

Stop and remove disposable stack data:

```sh
npm run test:stack:down
```

Teardown is scoped to Compose project `fitsupply-test` and removes only test-stack containers, networks, and the `fitsupply-test_postgres_stack_test_data` volume.

## Database Targeting

Each Prisma-backed service uses its matching test database on the internal `postgres-test` service:

```txt
auth-service          auth_test_db
catalog-service       catalog_test_db
inventory-service     inventory_test_db
order-service         order_test_db
cart-service          cart_test_db
payment-service       payment_test_db
shipping-service      shipping_test_db
notification-service  notification_test_db
```

No development `DATABASE_URL` or development Compose resource is used by this stack.

Task 3 only provides the Compose test environment. Shared test helpers, factories, formal migration orchestration, seed baselines, coverage configuration, and purchase-flow hardening belong to later tasks.