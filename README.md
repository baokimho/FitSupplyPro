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
| `packages/shared` | Shared errors, middleware, config validation, structured logging, JWT/user header helpers, internal secret middleware |

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
- Pino structured logging
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

## Configuration

For api-gateway, auth-service, catalog-service, inventory-service, and order-service,
`src/config/env.ts` is the source of truth. Environment values pass through the
service-local loader, shared validation primitives, typed service config, then
application runtime. `src/config/index.ts` loads `dotenv/config` and validates once;
application code should use typed config rather than arbitrary `process.env` reads.
Prisma CLI configuration remains separate from application runtime.

Defaults apply only when a variable is absent. Empty or whitespace-only strings
fail validation, including optional key variables. Strings retain their original
content; do not add surrounding whitespace to secrets or URLs.

### Minimum local setup

Examples use the existing per-service convention; no root `.env` is required.
The five scoped examples target **development Compose**, not host processes.
After `npm install`, copy them on a fresh clone. Skip each copy if its destination
already exists, to preserve existing local configuration:

```powershell
Copy-Item apps/api-gateway/.env.example apps/api-gateway/.env
Copy-Item apps/auth-service/.env.example apps/auth-service/.env
Copy-Item apps/catalog-service/.env.example apps/catalog-service/.env
Copy-Item apps/inventory-service/.env.example apps/inventory-service/.env
Copy-Item apps/order-service/.env.example apps/order-service/.env
Copy-Item docker/postgres/.env.example docker/postgres/.env
```

Use the same local `GATEWAY_SECRET` across all communicating services, and match
each database URL password to `POSTGRES_PASSWORD`. The examples use the public
placeholder `change-me-for-local-development`; replace it outside local development.
Database names are `auth_db`, `catalog_db`, `inventory_db`, and `order_db`.
Postgres user/database must remain `fitsupply` for the current development
healthcheck and database initialization SQL. Initialization runs only on a new
volume; changing env values does not update existing database credentials.

Full development Compose also requires cart/payment/shipping/notification `.env`
files. Copy their existing examples where present, then align their database
passwords and `GATEWAY_SECRET` with the values above. Cart currently has no example;
create `apps/cart-service/.env` with `NODE_ENV=development`, `PORT=3005`,
`DATABASE_URL=postgresql://fitsupply:change-me-for-local-development@postgres:5432/cart_db`,
`GATEWAY_SECRET=change-me-for-local-development`, and
`CATALOG_SERVICE_URL=http://catalog-service:3002`. These are implemented services,
not planned dependencies. Their runtime configuration is outside the five-service
typed-config scope documented here.

Supply your own auth RSA key pair as described below, then run
`docker compose config --quiet` and `docker compose up --build`. Development Compose
loads service env files and overrides the gateway's cart/payment/shipping/notification
URLs with container addresses. Only gateway port `3000` and Postgres host port
`5433` are published; domain service ports are exposed inside the Compose network.

For `npm run dev --workspace <service>` or `npm run start --workspace <service>`,
npm runs inside the workspace. Its `.env` is loaded there. Change database host/port
from `postgres:5432` to `localhost:5433` when using development Compose Postgres.
Change downstream URLs to `http://localhost:<port>` only when those services run
on the host (or have explicitly published ports). Set gateway `AUTH_SERVICE_URL`
explicitly for host development, including JWKS retrieval. Order's URL defaults
use container DNS and must be overridden for host dependencies. Database schema
migrations and downstream services must be available before starting a workspace;
development Compose applies existing migrations through its service commands.
Build shared code with `npm run build --workspace @shared/utils` before host runs.

### Per-service variable inventory

All rows below describe runtime variables. Required means no default unless a
key-file fallback is stated. Formats and sensitivity are shared across services:

| Variable type | Expected format | Sensitive? |
| --- | --- | --- |
| `NODE_ENV` | Exactly `development`, `test`, or `production` | No |
| `LOG_LEVEL` | Exactly `fatal`, `error`, `warn`, `info`, `debug`, `trace`, or `silent`; default `info` | No |
| `PORT` | Decimal integer TCP port, 1–65535 | No |
| `GATEWAY_SECRET` | Nonblank string; exact matching content | Yes |
| `DATABASE_URL` | PostgreSQL connection URL (`postgresql://` or `postgres://`); URL-encode credentials | Yes |
| `*_SERVICE_URL` | Complete HTTP(S) URL with hostname, no whitespace/backslashes | No; omit embedded credentials |
| `JWT_PRIVATE_KEY_BASE64` | Single-line base64 of UTF-8 private RSA JWK JSON | Yes |
| `JWT_PUBLIC_KEY_BASE64` | Single-line base64 of UTF-8 public RSA JWK JSON | No; public verification material |

`DATABASE_URL` is checked for nonblank content by the typed loader; PostgreSQL
connection validity is handled by the database client, not the URL primitive.

#### api-gateway

| Name | Required/default | Used for | Development Compose example |
| --- | --- | --- | --- |
| `NODE_ENV` | Optional; `development` | Runtime environment | `development` |
| `LOG_LEVEL` | Optional; `info` | Structured log threshold | `info` |
| `PORT` | Optional; `3000` | HTTP listener | `3000` |
| `GATEWAY_SECRET` | Required | Trusted proxy headers and JWKS request authentication | `change-me-for-local-development` |
| `AUTH_SERVICE_URL` | Optional; proxy `http://localhost:3001`, JWKS `http://auth-service:3001` | Auth proxy and `/jwks` public-key loader | `http://auth-service:3001` |
| `CATALOG_SERVICE_URL` | Optional; `http://localhost:3002` | Catalog proxy | `http://catalog-service:3002` |
| `INVENTORY_SERVICE_URL` | Optional; `http://localhost:3004` | Inventory proxy | `http://inventory-service:3004` |
| `ORDER_SERVICE_URL` | Optional; `http://localhost:3003` | Order proxy | `http://order-service:3003` |
| `CART_SERVICE_URL` | Optional; `http://localhost:3005` | Cart proxy | `http://cart-service:3005` |
| `PAYMENT_SERVICE_URL` | Optional; `http://localhost:3006` | Payment proxy | `http://payment-service:3006` |
| `SHIPPING_SERVICE_URL` | Optional; `http://localhost:3007` | Shipping proxy | `http://shipping-service:3007` |
| `NOTIFICATION_SERVICE_URL` | Optional; `http://localhost:3008` | Notification proxy | `http://notification-service:3008` |

The distinct auth proxy/JWKS defaults are current behavior. An explicit
`AUTH_SERVICE_URL` sets both to the same base URL. There is no separate JWKS URL env variable.

#### auth-service

| Name | Required/default | Used for | Development Compose example |
| --- | --- | --- | --- |
| `NODE_ENV` | Optional; `development` | Runtime environment and Prisma client reuse | `development` |
| `LOG_LEVEL` | Optional; `info` | Structured log threshold | `info` |
| `PORT` | Optional; `3001` | HTTP listener | `3001` |
| `GATEWAY_SECRET` | Required | Incoming internal-secret middleware, including `/jwks` | `change-me-for-local-development` |
| `DATABASE_URL` | Required | Prisma PostgreSQL pool | `postgresql://fitsupply:change-me-for-local-development@postgres:5432/auth_db` |
| `JWT_PRIVATE_KEY_BASE64` | Optional env; otherwise `keys/private.json`; key source required | RS256 signing and startup key import | `<base64-encoded-private-JWK>` |
| `JWT_PUBLIC_KEY_BASE64` | Optional env; otherwise `keys/public.json`; key source required | Verification, startup key import, and `/jwks` | `<base64-encoded-public-JWK>` |

#### catalog-service

| Name | Required/default | Used for | Development Compose example |
| --- | --- | --- | --- |
| `NODE_ENV` | Optional; `development` | Runtime environment and Prisma client reuse | `development` |
| `LOG_LEVEL` | Optional; `info` | Structured log threshold | `info` |
| `PORT` | Optional; `3002` | HTTP listener | `3002` |
| `GATEWAY_SECRET` | Required | Incoming internal-secret middleware | `change-me-for-local-development` |
| `DATABASE_URL` | Required | Prisma PostgreSQL pool | `postgresql://fitsupply:change-me-for-local-development@postgres:5432/catalog_db` |

#### inventory-service

| Name | Required/default | Used for | Development Compose example |
| --- | --- | --- | --- |
| `NODE_ENV` | Optional; `development` | Runtime environment and Prisma client reuse | `development` |
| `LOG_LEVEL` | Optional; `info` | Structured log threshold | `info` |
| `PORT` | Optional; `3004` | HTTP listener | `3004` |
| `GATEWAY_SECRET` | Required | Incoming internal-secret middleware | `change-me-for-local-development` |
| `DATABASE_URL` | Required | Prisma PostgreSQL pool | `postgresql://fitsupply:change-me-for-local-development@postgres:5432/inventory_db` |

#### order-service

| Name | Required/default | Used for | Development Compose example |
| --- | --- | --- | --- |
| `NODE_ENV` | Optional; `development` | Runtime environment and Prisma client reuse | `development` |
| `LOG_LEVEL` | Optional; `info` | Structured log threshold | `info` |
| `PORT` | Optional; `3003` | HTTP listener | `3003` |
| `GATEWAY_SECRET` | Required | Incoming middleware and outgoing internal HTTP calls | `change-me-for-local-development` |
| `DATABASE_URL` | Required | Prisma PostgreSQL pool | `postgresql://fitsupply:change-me-for-local-development@postgres:5432/order_db` |
| `CATALOG_SERVICE_URL` | Optional; `http://catalog-service:3002` | Product snapshots/validation | `http://catalog-service:3002` |
| `INVENTORY_SERVICE_URL` | Optional; `http://inventory-service:3004` | Reserve/release/consume orchestration | `http://inventory-service:3004` |
| `CART_SERVICE_URL` | Optional; `http://cart-service:3005` | Internal checkout cart access | `http://cart-service:3005` |
| `NOTIFICATION_SERVICE_URL` | Optional; `http://notification-service:3008` | Order notifications | `http://notification-service:3008` |

### Auth keys and JWKS

Provide a matching private/public **RSA JWK JSON** pair usable with JOSE `RS256`.
Private JWK contains signing material; public JWK contains public `kty`, `n`, and
`e`, with no private parameters. If supplying `kid`, use the same identifier on
both keys: signing copies the private JWK's `kid`, and `/jwks` publishes the public
JWK. JWT issuer `fitsupply-auth-service` and audience `fitsupply-api` are fixed in
code, not configurable environment variables. Both keys are imported before auth
listens; missing or malformed key sources fail startup. Supply a matching pair;
startup imports alone do not prove that independently supplied keys match.

For each key, its env variable takes precedence over file fallback. Encode the
whole UTF-8 JWK JSON as base64 and put the resulting single line in the variable.
Literal multiline PEM, escaped `\n` PEM, base64 PEM, and a JWKS wrapper containing
`keys` are not supported key representations. Placeholder key lines stay commented
in the example; uncomment only after supplying actual local keys.

To generate local values without writing private key files, run this from the
repository root and store the output only in your ignored auth `.env`:

```powershell
@'
import { generateKeyPair, exportJWK } from "jose";
const pair = await generateKeyPair("RS256", { extractable: true });
for (const [name, key] of [["JWT_PRIVATE_KEY_BASE64", pair.privateKey], ["JWT_PUBLIC_KEY_BASE64", pair.publicKey]]) {
  console.log(name + "=" + Buffer.from(JSON.stringify(await exportJWK(key))).toString("base64"));
}
'@ | node --input-type=module
```

File fallback uses `keys/private.json` and `keys/public.json` relative to
`process.cwd()`, with no env path override. Host npm workspace runs therefore use
`apps/auth-service/keys/`; Docker's working directory is `/app`, so its fallback
paths are `/app/keys/private.json` and `/app/keys/public.json`. Development Compose
does not mount keys and the auth image does not copy them; environment-based keys
are the simplest supported setup there. If using host fallback, keep private files
outside tracked paths or explicitly locally ignore them before creating them;
the repository's `.gitignore` does not ignore `keys/`.

Test Compose mounts `tests/fixtures/auth-keys` read-only at `/app/keys`; these are
public **test-only credentials**, never development/production keys. See
[test stack documentation](docker/postgres-test/compose-test-environment.md).

### Internal authentication and sensitive values

The exact variable is `GATEWAY_SECRET`, not `INTERNAL_SERVICE_SECRET`. All five
services require it. Gateway sends `x-internal-secret` to downstream services and
JWKS; order sends it to catalog/inventory/cart/notification. Receivers validate
the same header. Match the secret across every communicating service, including
the other implemented services in full Compose. This does not replace user JWT,
role, or ownership checks. Even direct domain `/health` requests need the secret.

Real database passwords, internal secrets, and private keys belong in ignored
local env files or deployment secret management, never committed files. Base64
is encoding, not encryption. Examples contain public placeholders only; public
keys are not confidential, but must correspond to the configured private key.

### Prisma tooling and test configuration

Auth/catalog/inventory/order `prisma.config.ts` also reads `DATABASE_URL` and
optional `SHADOW_DATABASE_URL`. The latter is tooling-only, has no configured
default, and is not a typed runtime variable. It is a sensitive PostgreSQL URL,
for example `postgresql://fitsupply:change-me-for-local-development@localhost:5433/auth_shadow_db`
(replace the database name per service). Use a separate disposable shadow database
when needed by Prisma migration tooling; do not point it at development data.
`migrate deploy` does not require it. Example lines remain commented.

`docker/postgres/.env.example` documents development `POSTGRES_USER=fitsupply`,
`POSTGRES_DB=fitsupply`, and sensitive `POSTGRES_PASSWORD` placeholder. These are
Postgres container inputs, not service runtime variables. Compose's existing
healthcheck/init SQL determines the user/database names, not service defaults.

Test Compose supplies `NODE_ENV=test`, the same internal service ports, container
URLs, `GATEWAY_SECRET=fitsupply_test_internal_secret`, and
`postgresql://fitsupply_test:fitsupply_test@postgres-test:5432/<service>_test_db`
for each database service. It publishes gateway `localhost:3500`; the DB-only
test Compose publishes Postgres `localhost:55433`. Test values are public local
fixtures. Test stacks do not load development `.env` files.

| Tool/test variable | Default or runner value | Purpose/format | Sensitive? |
| --- | --- | --- | --- |
| `TEST_DATABASE_HOST` | `localhost` | DB preparation host | No |
| `TEST_DATABASE_PORT` | `55433` | DB preparation TCP port | No |
| `AUTH_DATABASE_URL`, `CATALOG_DATABASE_URL`, `INVENTORY_DATABASE_URL`, `ORDER_DATABASE_URL` | Matrix sets `postgresql://fitsupply_test:fitsupply_test@localhost:55433/<service>_test_db` | Integration helpers' service-specific PostgreSQL URLs | Yes; public test credentials here |
| `API_GATEWAY_URL` | `http://localhost:3500` | E2E HTTP base URL | No |
| `E2E_ADMIN_EMAIL` | `admin.e2e@fitsupply.test` | E2E seeded admin email | No; test identity |
| `E2E_ADMIN_PASSWORD` | `AdminE2E!12345` | E2E seeded admin password | Yes; public test credential here |

`scripts/prepare-test-dbs.mjs` supplies runtime `DATABASE_URL` and tooling
`SHADOW_DATABASE_URL` for each Prisma CLI invocation; the test shadow database is
`fitsupply_test`. `TEST_DATABASE_HOST/PORT` only change preparation targeting, not
the matrix's fixed integration URLs. `npm run test:integration` prepares test DBs
and injects the matrix URLs and test secret. `npm run test:e2e` fixes the gateway
URL and admin values shown above, seeds that identity, and uses the isolated test
Compose keys. E2E env overrides apply when invoking the test directly, not the
wrapper's seeded identity. No test variables belong in production service env files.

## Phase 1 Backend Hardening

Phase 1 is complete for api-gateway, auth-service, catalog-service,
inventory-service, and order-service: consistent API error contract, hardened
shared middleware, validated config primitives, typed service-local config,
standardized environment examples/documentation, shared structured logging, and
five-service logging migration. Final regression: 278 unit, 92 integration, and
3 Docker E2E tests passed; typecheck, lint, build, and Compose configuration passed.
All five scoped services were healthy during E2E; disposable test stacks are
removed by the existing runners. Phase 2 reliability work is documented below.

### Error handling

Use the HTTP error classes exported by `@shared/utils`, defined in
`packages/shared/src/errors/httpErrors.ts`. Controllers forward failures through
`wrapAsync` or Express 5 async handling; avoid logging the same exception again
in each layer. The shared handler maps expected errors to their status/code and
unexpected errors to 500 / `INTERNAL_ERROR`. Responses retain the nested
`{ error: { code, message, details? } }` envelope. Put only public, safe domain
context in `details`; internal diagnostics belong in the error's `cause`, never
response details.

### Logging

Pino is owned by `packages/shared`. Each scoped service's `src/logger.ts` creates
its own instance from `createLogger`, using service identity, validated
`config.nodeEnv`, and `config.logLevel`. Application modules import that local
logger; use child loggers for useful operation context. JSON goes to stdout with
`service`, `environment`, numeric Pino `level`, `time`, and `msg`. No transport
or pretty-printing dependency is required.

`LOG_LEVEL` defaults to `info`; allowed values appear in the configuration tables.
Use debug for diagnostics/expected rejection context, info for startup and HTTP
completion, warn for recoverable background/notification failures, error for
request/proxy failures, and fatal for failed startup.

```ts
import { logger } from "./logger.js";

logger.info({ port }, "service started");
logger.error({ err }, "operation failed");
```

Entrypoints install `httpLogger(logger)` before body parsing/auth and
`createErrorHandler(logger)` after routes. Completion events include method,
original path without query/fragment, statusCode, and durationMs. Each service
hop has its own completion event. Expected 4xx errors have debug context only;
5xx failures retain internal Error diagnostics separately from safe responses.

Never log entire config, environment, bodies, headers, upstream response payloads,
passwords, JWTs, cookies, gateway secrets, database credentials, or RSA key material.
The factory uses Pino redaction for known sensitive fields at root and within two
object levels, including child bindings and request-shaped objects. Error
serialization keeps type/message/stack (including cause diagnostics), omits
arbitrary attached payloads, and masks credential URLs, bearer text, and PEM key
blocks. This is defense in depth, not arbitrary recursive/text sanitization: use
allowlisted context and keep secrets out of messages and arbitrary field names.

Scoped runtime source has no `console.*`; its only `process.env` reads are the
five `src/config/index.ts` boundaries. Scripts/seeds, tests, generated Prisma code,
and the four unscoped services remain outside this migration. The default shared
`errorHandler` retains its console fallback for those legacy consumers; scoped
services use `createErrorHandler(logger)`. Prisma tooling and shared test helpers
also retain intentional environment reads.

Request/correlation IDs, tracing, OpenTelemetry, metrics, advanced health/readiness,
graceful-shutdown standardization, retries, circuit breakers, and
messaging/outbox/saga work are intentionally deferred to later phases. Existing
auth shutdown behavior is preserved; Phase 1 adds none of these architectures.

## Phase 2 Reliability Foundation

Correlation uses `x-request-id` (one inbound HTTP hop) and `x-trace-id` (one
synchronous workflow). IDs must be UUIDs: 36 characters, no whitespace/control
characters, and no repeated header values. Invalid/missing values are replaced.
The gateway accepts a valid client request ID but always creates a fresh trace ID.
Each outgoing call gets a new request ID; internal services preserve its trace ID.
The gateway returns its own `x-request-id`, exposed through CORS, including proxy
responses. Trace IDs are internal and are not returned as response headers.

Shared `correlationMiddleware` runs before HTTP logging/body parsing/auth.
`AsyncLocalStorage` isolates context across asynchronous order helpers without
changing business signatures; request typing also exposes `req.correlation`.
Shared logger instances automatically include request/trace fields inside request
context. Completion, error, and gateway proxy logs retain explicit request context.
Gateway proxies, JWKS loading, and existing order downstream calls forward it.
Background/process logs have no fabricated request IDs. This is correlation only;
no span IDs, OpenTelemetry, or tracing platform is introduced.

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
- Deployment documentation.

Do not claim deployment, CI/CD, Kubernetes, Terraform, cloud hosting, Stripe, or message queues are implemented until they exist in the repository.
