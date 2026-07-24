# FitSupply Pro Agent Guide

Short repo rules for coding agents working in this monorepo.

## Architecture And Ownership

Microservices monorepo. Keep current service boundaries unless user explicitly asks to change them.

- `apps/api-gateway`
  - Ownership: edge routing, auth enforcement, rate limiting, proxying, user-context header forwarding
  - Must not absorb downstream business logic

- `apps/auth-service`
  - Ownership: register, login, refresh-token rotation, logout, `/me`, JWKS, auth token issuance/verification support

- `apps/catalog-service`
  - Ownership: categories, brands, products, publish/unpublish, product query/filter/sort

- `apps/inventory-service`
  - Ownership: inventory records, stock adjustment, reserve/release, availability checks

- `apps/cart-service`
  - Ownership: user cart state, item snapshots, cart item CRUD, internal cart access for checkout

- `apps/order-service`
  - Ownership: order creation, checkout from cart, inventory reservation/release orchestration, order cancel/confirm

- `apps/payment-service`
  - Ownership: payment records, payment state transitions, order confirmation trigger, payment notifications

- `apps/shipping-service`
  - Ownership: shipment records, shipment state transitions, shipping notifications

- `apps/notification-service`
  - Ownership: notification persistence, read-state, internal notification intake

- `packages/shared`
  - Ownership: shared middleware, auth helpers, header helpers, validation middleware, reusable HTTP error classes

## Stack And Reuse Rules

Current stack:

- Node.js
- TypeScript
- npm workspaces
- Express 5
- Prisma
- PostgreSQL
- Docker / Docker Compose
- Zod
- JOSE / JWT

Reuse existing shared code first.

Preferred shared imports from `@shared/utils`:

- middleware: `wrapAsync`, `validateRequest`, `errorHandler`, `requireGatewaySecret`
- auth/header: JWT helpers, user header helpers
- errors: `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `ServiceUnavailableError`

Do not introduce parallel error shapes when an existing shared error class fits.

## Conventions

- Preserve current service boundaries unless explicitly asked to change them.
- Do not use `any`.
- Do not use `// @ts-ignore` or `// @ts-expect-error` to hide type problems unless user explicitly asks and reason is documented.
- Do not weaken, skip, delete, or bypass tests to make pipeline pass.
- Do not edit unrelated code.
- Do not run destructive database commands against dev data.
  - Forbidden unless explicitly requested: reset/drop/recreate/force-style DB actions such as `prisma migrate reset`, dropping databases, deleting Docker volumes with live dev data intent.
- Do not commit, push, or deploy unless explicitly asked.
- Every new business behavior must include automated test coverage.

## Commands

Run commands from the repository root.

### Install

- `npm install`

### Lint

- `npm run lint`

### Typecheck

- `npm run typecheck`

### Test

- `npm run test`
- `npm run test:unit`
- `npm run test:integration`
- `npm run test:e2e`

Business test coverage has not yet been implemented. Current Vitest commands intentionally use `--passWithNoTests` so tooling can run before real coverage lands. New business behavior still requires meaningful automated tests.

### Build

- `npm run build`

### Docker

- `docker compose config`
- `docker compose up --build`

Use Docker-backed flow checks for cross-service changes.

## Definition Of Done

A task is done only when all relevant items below are satisfied:

1. Code implemented.
2. New tests added or existing tests updated for changed behavior.
3. Relevant tests pass.
4. Typecheck and lint pass.
5. Docker E2E passes if change affects cross-service behavior.
6. Git diff reviewed for unrelated changes.
7. Final report includes commands run and results.
