import express from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { buildBrand, buildCategory, buildProduct, cleanupDatabase, createFactoryContext, createGatewaySecretMiddleware, errorHandler, requireTestDatabaseUrl } from "@shared/utils";
import type { PrismaClient } from "./generated/prisma/index.js";

const databaseUrl = requireTestDatabaseUrl("catalog_test_db");
const secret = "fitsupply_test_internal_secret";
let prisma: PrismaClient;
let close: () => Promise<void>;
let app: express.Express;
let product: ReturnType<typeof buildProduct>;
beforeAll(async () => {
  process.env.DATABASE_URL = databaseUrl; process.env.GATEWAY_SECRET = secret;
  const database = await import("./config/db.js"); prisma = database.default; close = database.closeDb;
  app = express(); app.use(express.json(), createGatewaySecretMiddleware(secret));
  app.use((await import("./routes/products.route.js")).default, errorHandler);
});
const clean = () => cleanupDatabase("catalog_test_db", databaseUrl, { execute: async (sql) => { await prisma.$executeRawUnsafe(sql); } });
beforeEach(async () => {
  await clean();
  const context = createFactoryContext();
  const category = await prisma.category.create({ data: buildCategory({}, context) });
  const brand = await prisma.brand.create({ data: buildBrand({}, context) });
  product = buildProduct({ categoryId: category.id, brandId: brand.id, isPublished: false }, context);
});
afterAll(async () => { if (prisma) { try { await clean(); } finally { await close(); } } });

it("rejects untrusted/invalid creation before any Catalog row commits", async () => {
  await request(app).post("/products").send(product).expect(403);
  await request(app).post("/products").set("x-internal-secret", secret).send({ ...product, price: -1 }).expect(400);
  expect(await prisma.product.count()).toBe(0);
});
it("persists authoritative decimal and relations; publication controls filtered results", async () => {
  const created = await request(app).post("/products").set("x-internal-secret", secret).send(product).expect(201);
  const id = String(created.body.data.id);
  expect(created.body.data).toMatchObject({ price: "19.99", isPublished: false, category: { id: product.categoryId }, brand: { id: product.brandId } });
  const drafts = await request(app).get("/products?isPublished=true").set("x-internal-secret", secret).expect(200);
  expect(drafts.body.data).toHaveLength(0);
  await request(app).patch(`/products/${id}/publish`).set("x-internal-secret", secret).expect(200);
  const published = await request(app).get("/products?isPublished=true&sort=price_asc&limit=1").set("x-internal-secret", secret).expect(200);
  expect(published.body.data).toMatchObject([{ id, isPublished: true }]);
  expect(published.body.pagination).toMatchObject({ totals: 1, totalPages: 1 });
  await request(app).patch(`/products/${id}/unpublish`).set("x-internal-secret", secret).expect(200);
  expect((await prisma.product.findUniqueOrThrow({ where: { id } })).isPublished).toBe(false);
});
it("service conflicts and database uniqueness both prevent duplicate product identity", async () => {
  await request(app).post("/products").set("x-internal-secret", secret).send(product).expect(201);
  await request(app).post("/products").set("x-internal-secret", secret).send({ ...product, slug: "another-slug" }).expect(409);
  await expect(prisma.product.create({ data: { ...product, id: randomUUID() } })).rejects.toMatchObject({ code: "P2002" });
  expect(await prisma.product.count()).toBe(1);
});
it("missing and deleted references cannot leave dangling Catalog products", async () => {
  await request(app).post("/products").set("x-internal-secret", secret).send({ ...product, categoryId: "missing" }).expect(404);
  await expect(prisma.product.create({ data: { ...product, categoryId: "missing" } })).rejects.toMatchObject({ code: "P2003" });
  expect(await prisma.product.count()).toBe(0);
  await prisma.product.create({ data: product });
  await expect(prisma.category.delete({ where: { id: product.categoryId } })).rejects.toMatchObject({ code: "P2003" });
  expect(await prisma.product.count()).toBe(1);
});
