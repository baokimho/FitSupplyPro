# FitSupply Pro

**Microservices Fitness E-commerce & Nutrition Platform**

**Status:** In Progress — backend services partially implemented, fullstack product vision in development

FitSupply Pro is designed as a fullstack platform that combines fitness commerce with practical nutrition and body-composition tools in one product experience. The target product allows customers to browse and buy supplements, gym accessories, and recovery products while also using built-in fitness utilities such as TDEE and macro calculation, body fat estimation, food logging, and personal progress tracking.

The long-term goal is to make FitSupply Pro useful beyond checkout. Instead of acting only as an online store, the product vision is a user-centered health and performance platform where shopping, nutrition planning, and progress monitoring support each other. Customers should be able to discover products, manage orders, understand calorie and macro needs, and track their fitness journey from a single account.

For admins, the target product is intended to support catalog operations and business visibility at the same time. The planned admin experience includes managing products, inventory, orders, and analytics through a structured service-based architecture that can grow over time.

This repository does **not** implement that full product yet. The current codebase is a **backend-only monorepo** with several backend services already started, while the frontend and multiple planned product domains are still in progress.

## Current Status

FitSupply Pro currently exists as a TypeScript backend monorepo built around a microservices-style architecture. The repository includes an API Gateway, an authentication service, a catalog service, a partially implemented inventory service, and a very early order service.

What exists today is mainly backend infrastructure and core commerce-oriented APIs:

- `api-gateway` is implemented and routes requests to backend services.
- `auth-service` is implemented for registration, login, token refresh, logout, JWKS, and authenticated user lookup.
- `catalog-service` is implemented with CRUD APIs for categories, brands, and products.
- `inventory-service` is partially implemented with inventory creation, lookup, update, and stock adjustment flows.
- `order-service` is still at an early setup stage and currently exposes only a health endpoint.

The following are **not implemented yet** in this repository: frontend application, cart, checkout, full order workflow, fitness service, nutrition service, notifications, analytics, automated tests, CI/CD, Swagger/OpenAPI, and production deployment.

## Target Product Features

### Customer Features (Planned)

- Browse supplements, accessories, and recovery products
- Search, filter, and sort product listings
- Add products to cart and place orders
- View account profile and order history
- Calculate TDEE and daily macro targets
- Estimate body fat using guided inputs
- Log meals and nutrition intake
- Track body metrics and fitness progress over time

### Admin Features (Planned)

- Manage categories, brands, and products
- Manage inventory and stock movements
- Manage customer orders and fulfillment status
- Review sales and operational analytics
- Monitor platform activity across services

## Currently Implemented

### API Gateway

- Proxy routing to backend services
- JWT access token verification
- Rate limiting for auth, catalog, inventory, and order routes
- `Helmet` for basic HTTP hardening
- `Morgan` request logging
- Shared error handling
- Internal secret header for service-to-service protection

### Auth Service

- Prisma models for `User` and `RefreshToken`
- User registration
- User login
- Authenticated user lookup (`/me`)
- Refresh token endpoint
- Logout endpoint
- JWKS endpoint for public key distribution
- Password hashing
- JWT-based authentication
- Refresh token rotation and revocation
- Zod request validation

### Catalog Service

- Prisma models for `Category`, `Brand`, and `Product`
- CRUD APIs for categories
- CRUD APIs for brands
- CRUD APIs for products
- Product filtering, pagination, and sorting
- Product publish and unpublish actions
- Prisma migrations
- Prisma seed data

### Inventory Service

- Prisma model for `Inventory`
- Create inventory records
- Get inventory by `productId`
- Update inventory by `productId`
- Batch inventory lookup
- Stock adjustment endpoint
- `availableStock` response logic
- Stock consistency checks

### Order Service

- Health endpoint only

## Architecture Diagram

```text
                           Planned
                    ┌──────────────────┐
                    │   React Frontend │
                    │  Store + Admin   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   API Gateway    │
                    │  Implemented     │
                    └───────┬──────────┘
                            │
     ┌──────────────────────┼──────────────────────────┬─────────────────────┐
     │                      │                          │                     │
     ▼                      ▼                          ▼                     ▼
┌───────────────┐   ┌───────────────┐         ┌───────────────┐     ┌───────────────┐
│ Auth Service  │   │ Catalog       │         │ Inventory     │     │ Order Service │
│ Implemented   │   │ Service       │         │ Service       │     │ Early         │
│               │   │ Implemented   │         │ Partial       │     │ Health only   │
└───────────────┘   └───────────────┘         └───────────────┘     └───────────────┘
        │                    │                         │                     │
        └──────────────┬─────┴───────────────┬─────────┴─────────────────────┘
                       │                     │
                       ▼                     ▼
                ┌──────────────────────────────────┐
                │        PostgreSQL + Prisma       │
                │ auth_db / catalog_db /           │
                │ inventory_db / order_db          │
                └──────────────────────────────────┘

                     Planned Future Services
     ┌───────────────────────────────────────────────────────────────┐
     │ Cart / Checkout / Fitness / Nutrition / Notifications /      │
     │ Analytics / Reporting                                        │
     └───────────────────────────────────────────────────────────────┘
```

## Services Table

| Service | Responsibility | Status |
|---|---|---|
| `api-gateway` | Entry point, proxy routing, auth verification, rate limiting, request protection | Implemented |
| `auth-service` | Authentication, JWT issuing/verification support, refresh token lifecycle, user session endpoints | Implemented |
| `catalog-service` | Categories, brands, products, product querying, publish state | Implemented |
| `inventory-service` | Inventory records, stock lookup, stock adjustment, stock rules | Partially implemented |
| `order-service` | Order domain | Very early, health endpoint only |
| `packages/shared` | Shared auth, middleware, validation, and error utilities | Implemented |

## Current Tech Stack

Only technologies that exist in the repository today:

- TypeScript
- Node.js
- Express 5
- npm workspaces
- PostgreSQL
- Prisma
- Zod
- Docker
- Docker Compose
- `jose` / JWT
- `helmet`
- `morgan`
- `http-proxy-middleware`

## Planned Tech Stack

Target stack for the completed product vision:

- React
- Tailwind CSS
- TanStack Query
- Recharts
- Swagger / OpenAPI
- Automated tests
- GitHub Actions
- AWS

These technologies are **planned** and are **not implemented in the current repository** unless also listed in the current stack section above.

## Monorepo Structure

Current repository structure:

```text
FitSupplyPro/
├─ apps/
│  ├─ api-gateway/
│  ├─ auth-service/
│  ├─ catalog-service/
│  ├─ inventory-service/
│  └─ order-service/
├─ docker/
│  └─ postgres/
├─ packages/
│  └─ shared/
├─ REST/
│  ├─ auth-service.http
│  ├─ catalog-service.http
│  └─ inventory-service.http
├─ docker-compose.yml
├─ package.json
└─ package-lock.json
```

## Getting Started

### Prerequisites

- Node.js
- npm
- Docker
- Docker Compose

### Install Dependencies

```bash
npm install
```

### Start the Full Local Backend with Docker Compose

This is the most accurate way to run the current repository because the services are already wired through `docker-compose.yml`.

```bash
docker compose up --build
```

This starts:

- `api-gateway` on port `3000`
- `auth-service`
- `catalog-service`
- `inventory-service`
- `order-service`
- `postgres`
- `shared-watcher`

### Local Development Commands

The repository uses npm workspaces, and each service exposes a `dev` script.

```bash
npm --prefix apps/api-gateway run dev
npm --prefix apps/auth-service run dev
npm --prefix apps/catalog-service run dev
npm --prefix apps/inventory-service run dev
npm --prefix apps/order-service run dev
```

Shared package watcher:

```bash
npm --prefix packages/shared run watch
```

### Build Commands

```bash
npm --prefix packages/shared run build
npm --prefix apps/auth-service run build
npm --prefix apps/catalog-service run build
npm --prefix apps/inventory-service run build
npm --prefix apps/order-service run build
npm --prefix apps/api-gateway run build
```

## Environment Variables

The repository currently uses per-service `.env` files plus a Postgres env file under `docker/postgres/`.

### API Gateway

- `PORT`
- `AUTH_SERVICE_URL`
- `CATALOG_SERVICE_URL`
- `INVENTORY_SERVICE_URL`
- `ORDER_SERVICE_URL`
- `GATEWAY_SECRET`

### Auth Service

- `PORT`
- `DATABASE_URL`
- `NODE_ENV`
- `JWT_PRIVATE_KEY_BASE64`
- `JWT_PUBLIC_KEY_BASE64`
- `GATEWAY_SECRET`

### Catalog Service

- `PORT`
- `DATABASE_URL`
- `GATEWAY_SECRET`

### Inventory Service

- `PORT`
- `DATABASE_URL`
- `GATEWAY_SECRET`

### Order Service

- `PORT`
- `DATABASE_URL`
- `GATEWAY_SECRET`

### PostgreSQL

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

### Note

Do not publish real secrets or reusable credentials in a public repository. For a portfolio-safe setup, prefer committed `.env.example` files and keep actual secrets local.

## API Overview

Only endpoints that are present in the current route files are listed below.

### API Gateway

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/refresh-token`
- `POST /auth/logout`
- `GET /auth/jwks`
- `GET /catalog/health`
- `POST /catalog/categories`
- `GET /catalog/categories`
- `GET /catalog/categories/:id`
- `PUT /catalog/categories/:id`
- `DELETE /catalog/categories/:id`
- `POST /catalog/brands`
- `GET /catalog/brands`
- `GET /catalog/brands/:id`
- `PATCH /catalog/brands/:id`
- `DELETE /catalog/brands/:id`
- `POST /catalog/products`
- `GET /catalog/products`
- `GET /catalog/products/:id`
- `PUT /catalog/products/:id`
- `DELETE /catalog/products/:id`
- `PATCH /catalog/products/:id/publish`
- `PATCH /catalog/products/:id/unpublish`
- `POST /inventory`
- `POST /inventory/products/batch`
- `GET /inventory/products/:productId`
- `PATCH /inventory/products/:productId`
- `POST /inventory/products/:productId/adjust`
- `GET /order/health`

### Auth Service

- `GET /health`
- `GET /jwks`
- `GET /me`
- `POST /register`
- `POST /login`
- `POST /refresh-token`
- `POST /logout`

### Catalog Service

- `GET /health`
- `POST /categories`
- `GET /categories`
- `GET /categories/:id`
- `PUT /categories/:id`
- `DELETE /categories/:id`
- `POST /brands`
- `GET /brands`
- `GET /brands/:id`
- `PATCH /brands/:id`
- `DELETE /brands/:id`
- `POST /products`
- `GET /products`
- `GET /products/:id`
- `PUT /products/:id`
- `DELETE /products/:id`
- `PATCH /products/:id/publish`
- `PATCH /products/:id/unpublish`

### Inventory Service

- `GET /health`
- `POST /`
- `POST /products/batch`
- `GET /products/:productId`
- `PATCH /products/:productId`
- `POST /products/:productId/adjust`

### Order Service

- `GET /health`

## Security Notes

- Backend services are protected with an internal secret header check (`GATEWAY_SECRET`) to reduce direct service access outside the gateway.
- The gateway verifies JWT access tokens before forwarding protected requests.
- Refresh token lifecycle logic includes hashing, rotation, revocation, and cleanup behavior in the auth service.
- Rate limiting is enabled at the gateway level for auth and service routes.
- `Helmet` is enabled in the gateway for basic HTTP hardening.

This is still a development-stage codebase, so security hardening should be considered in progress rather than complete.

## Known Limitations

- Backend-only repository at the moment
- No frontend application yet
- No cart or checkout flow yet
- No full order workflow yet
- `order-service` is still at a very early stage
- `inventory-service` is only partially implemented
- No dedicated fitness service yet
- No dedicated nutrition service yet
- No notifications or analytics services yet
- No automated test suite yet
- No CI/CD pipeline yet
- No Swagger / OpenAPI documentation yet
- No production deployment setup documented

## Roadmap

### Short-Term

- Expand `order-service` beyond health checks into real order domain APIs
- Continue inventory workflows and service integration
- Add clearer environment setup and `.env.example` files
- Improve API documentation for local development
- Add automated tests for existing backend services

### Full Product Roadmap

- Build the React frontend for customer and admin experiences
- Add cart, checkout, and complete order lifecycle features
- Introduce fitness calculators and macro planning workflows
- Add nutrition logging and progress tracking features
- Add notifications and analytics capabilities
- Add OpenAPI documentation, CI/CD, and production-ready infrastructure over time

## Portfolio Note

This project is best presented as a **microservices backend in progress for a larger fullstack fitness commerce product**. The product vision is intentionally broader than the current implementation, but the existing code already demonstrates backend architecture, service separation, authentication, catalog APIs, and early inventory workflows.

If you are reviewing this repository as part of a portfolio, the most accurate description today is:

> Backend services partially implemented for a planned fullstack fitness e-commerce and nutrition platform.
