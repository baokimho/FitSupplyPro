# FitSupply Pro

Backend-only TypeScript microservices portfolio for a fitness commerce purchase flow.

Status: backend functional closure complete. Feature work is frozen after final verification; next phase is DevOps, deployment, observability, and documentation hardening. Frontend and fitness/nutrition product areas are not implemented in this repository yet.

## Services

| Workspace | Responsibility |
| --- | --- |
| `apps/api-gateway` | Public entry point, JWT verification, RBAC, request proxying, rate limiting, trusted header forwarding |
| `apps/auth-service` | Registration, login, refresh token rotation, logout, `/me`, JWKS, user roles |
| `apps/catalog-service` | Categories, brands, products, product publishing and browsing |
| `apps/inventory-service` | Inventory records, stock adjustments, reservation, release, consume, inventory operation idempotency |
| `apps/cart-service` | Customer carts, item snapshots, cart versioning, internal cart access for checkout |
| `apps/order-service` | Checkout, order lifecycle, delivery snapshot, inventory orchestration, cancellation/confirmation |
| `apps/payment-service` | Mock payment records, one payment per order, payment idempotency, authoritative state transitions |
| `apps/shipping-service` | Shipment records, one shipment per order, shipment snapshot from confirmed order, fulfillment status transitions |
| `apps/notification-service` | Notification persistence and customer read-state |
| `packages/shared` | Shared errors, middleware, validation, JWT/user header helpers, internal secret middleware |

## Architecture

```text
Client
  |
  v
API Gateway
  |-- Auth Service
  |-- Catalog Service
  |-- Inventory Service
  |-- Cart Service
  |-- Order Service
  |-- Payment Service
  |-- Shipping Service
  `-- Notification Service

Each domain service owns its own Prisma schema and PostgreSQL database/schema in local/test compose environments.
Service-to-service commands use HTTP plus the configured internal secret.
```

The gateway verifies access tokens and derives trusted `x-user-id` and `x-user-role` headers. External callers cannot supply trusted identity or internal-secret headers. Public gateway routing blocks `/internal/*` before proxying.

## Purchase Lifecycle

Happy path:

```text
Auth
-> Catalog browse/admin product setup
-> Cart
-> Checkout
-> Inventory reservation
-> Order PENDING
-> Payment creation
-> Payment confirmation
-> Inventory reservation consume
-> Order CONFIRMED
-> Shipment creation from order delivery snapshot
-> SHIPPED
-> DELIVERED
-> Customer notifications
```

Failure path:

```text
Checkout
-> Inventory reservation
-> Order PENDING
-> Payment FAILED or CANCELLED
-> Order CANCELLED
-> Inventory reservation release
```

Important invariants:

- `PENDING` order means inventory is reserved but stock is not consumed.
- `CONFIRMED` order means reservation was consumed and stock decreased.
- `CANCELLED` order means reservation was released and stock was not consumed.
- Payment is not marked `PAID` unless downstream order confirmation and inventory consumption succeed.
- Shipment creation requires a confirmed order and copies immutable delivery/contact snapshot data from order-service.

## Idempotency, Concurrency, Compensation

- Checkout uses PostgreSQL-backed idempotency scoped to authenticated user and checkout action.
- Payment creation uses PostgreSQL-backed idempotency scoped to authenticated user and payment creation action.
- Request fingerprints are canonicalized so key reuse with different input returns conflict.
- Inventory reserve/release/consume can use deterministic `operationId` values and the `InventoryOperation` table to avoid double mutation on retries.
- Payment uniqueness is enforced by the database: one logical payment per order.
- Shipment uniqueness is enforced by the database: one shipment per order.
- Checkout and order lifecycle use retry-safe compensation instead of distributed transactions. If a multi-step downstream operation fails, completed inventory mutations are released or compensated through idempotent operations where the domain allows it.

## Security Boundary

Customer users can:

- Browse catalog.
- Manage their own cart.
- Checkout.
- View their own orders, payments, shipments, and notifications.
- Cancel their own pending order where the domain permits cancellation.

Admin users can:

- Mutate catalog categories, brands, products, and publish state.
- Create/update/adjust inventory.
- Execute mock payment authoritative transitions.
- Create shipments and update fulfillment status/tracking.

Internal-only routes require `GATEWAY_SECRET` and are not publicly proxyable through the gateway. Ownership checks remain separate from RBAC: customer reads still require the resource to belong to the authenticated user.

## Database Invariants

Current schemas and migrations enforce key backend invariants:

- Inventory stock and reserved stock are nonnegative, with atomic reserve/release/consume updates.
- Checkout stores durable idempotency progress and delivery snapshot data.
- Orders validate positive item quantity and nonnegative monetary totals.
- Payments require nonblank identifiers/currency, nonnegative money, one payment per order, provider payment id uniqueness where applicable, and durable idempotency state.
- Shipments require one row per order and copy delivery snapshot fields from confirmed orders.

Migrations are real Prisma migrations under each service's `prisma/migrations` directory. Do not edit old migrations; add new migrations for schema changes.

## Tech Stack

- Node.js 20
- TypeScript
- npm workspaces
- Express 5
- PostgreSQL
- Prisma
- Zod
- JOSE/JWT
- Docker Compose
- Vitest and Supertest
- ESLint

## Repository Layout

```text
apps/
  api-gateway/
  auth-service/
  catalog-service/
  inventory-service/
  cart-service/
  order-service/
  payment-service/
  shipping-service/
  notification-service/
packages/
  shared/
scripts/
  e2e.mjs
  prepare-test-dbs.mjs
  test-matrix.mjs
tests/
  e2e/
docker-compose.yml
docker-compose.test-db.yml
docker-compose.test.yml
```

## Commands

Run from repository root.

```bash
npm install
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration
npm run test:e2e
npm run build
```

Useful Docker test commands:

```bash
npm run test:db:up
npm run test:db:prepare
npm run test:db:down
npm run test:stack:config
```

`npm run test:integration` prepares disposable PostgreSQL test databases through `docker-compose.test-db.yml` and runs the service integration matrix. `npm run test:e2e` starts the full backend test stack from `docker-compose.test.yml`, seeds a deterministic admin identity, runs the cross-service purchase lifecycle E2E test through the API Gateway, then tears the stack down.

## Local Development

Install dependencies first:

```bash
npm install
```

Run all services with Docker Compose:

```bash
docker compose up --build
```

Or run a service workspace directly after its database and dependencies are available:

```bash
npm run dev --workspace api-gateway
npm run dev --workspace auth-service
npm run dev --workspace catalog-service
npm run dev --workspace inventory-service
npm run dev --workspace cart-service
npm run dev --workspace order-service
npm run dev --workspace payment-service
npm run dev --workspace shipping-service
npm run dev --workspace notification-service
```

Environment is service-specific. Keep real secrets out of git. `GATEWAY_SECRET` must match between gateway and internal services for service-to-service calls.

## Docker Notes

Service Dockerfiles install workspace dependencies from the root lockfile context and copy each workspace manifest before `npm install`. Prisma-generating images invoke Prisma through the installed workspace CLI, for example:

```bash
npm exec --workspace catalog-service -- prisma generate --config prisma.config.ts --schema prisma/schema.prisma
```

Do not use `npx prisma generate` in Dockerfiles because it can download an unrelated Prisma version if the local binary is not resolved.

## Generated Prisma Clients

Several services currently have `apps/*/src/generated/prisma` committed. This is the current repository state and is left intact for freeze stability.

Recommended DevOps-phase cleanup: generate Prisma clients during install/build and gitignore generated output once all local, test, and Docker workflows consistently regenerate clients from schema and migrations.

## Test Coverage

Current meaningful coverage:

- Gateway security integration tests for RBAC, internal route blocking, and trusted header sanitization.
- Inventory integration tests for reserve/release/consume idempotency and stock constraints.
- Cart integration tests for version behavior.
- Order integration tests for checkout idempotency, inventory reservation, and compensation behavior.
- Payment integration tests for uniqueness, idempotency, constraints, and lifecycle error mapping.
- Shipping integration tests for one shipment per order, snapshot copying, status transitions, and notifications.
- Root E2E test for complete happy path, payment failure rollback, idempotency, and focused security negatives through the API Gateway.

Known non-blocking gaps:

- `auth-service` has no dedicated integration test file.
- `catalog-service` has no dedicated integration test file.
- `notification-service` has no dedicated integration test file.

These are not current backend freeze blockers because the full E2E suite exercises authentication, catalog admin setup/browse, and notification read behavior through the gateway. Add targeted service-level tests later when changing those services.

## Next Phase

Backend feature work should pause after freeze. Next work should focus on DevOps and operational maturity:

- Production Docker image hardening.
- CI/CD pipeline.
- Deployment manifests/infrastructure.
- Observability, logging, health checks, and runbooks.
- Environment example files and deployment documentation.

Do not claim deployment, CI/CD, Kubernetes, Terraform, cloud hosting, Stripe, or message queues are implemented until they exist in the repository.
