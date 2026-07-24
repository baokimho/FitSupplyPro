# Prisma Test Migration And Seed Baseline

Task 6 prepares every disposable test database from committed Prisma migrations. It does not use `prisma db push`.

## Command

Start or reset disposable PostgreSQL first:

```sh
npm run test:db:reset
```

Apply all test schemas:

```sh
npm run test:db:prepare
```

The preparation script runs services in this deterministic order:

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

For each service, the script:

1. Builds a guarded `DATABASE_URL` for the matching `*_test_db` database.
2. Builds a guarded `SHADOW_DATABASE_URL` for the disposable `fitsupply_test` database.
3. Runs `prisma migrate diff --from-migrations ... --to-schema ... --exit-code`.
4. Stops immediately with a non-zero exit code if drift is detected or a command fails.
5. Runs `prisma migrate deploy` only after drift check passes.

The default target is `localhost:55433`, user/password `fitsupply_test` / `fitsupply_test`. Override only the disposable test host/port with `TEST_DATABASE_HOST` and `TEST_DATABASE_PORT`.

## Seed Baseline

Baseline seed is intentionally empty for Task 6. No data is shared by every integration scenario yet. Scenario-specific data belongs in Task 5 factories.

## Catalog Legacy Inventory Migration

Catalog migration `20260724000000_drop_legacy_inventory` removes the legacy catalog `Inventory` table created by the initial catalog migration. Inventory is now owned by `inventory-service` and stored in `inventory_test_db` during tests.

Deploying this forward migration to an existing non-test environment may destroy legacy catalog Inventory data. Before any non-test deployment, verify backups and data-retention requirements, and decide whether historical catalog inventory data must be exported or migrated elsewhere. Task 6 does not copy or migrate development data.