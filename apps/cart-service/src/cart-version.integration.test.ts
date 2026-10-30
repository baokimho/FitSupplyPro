import express from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanupDatabase, requireTestDatabaseUrl, createGatewaySecretMiddleware, createErrorHandler, createLogger } from "@shared/utils";
import type { PrismaClient } from "./generated/prisma/index.js";
import type { removeCartItemsService as removeCartItemsServiceType } from "./services/cart.service.js";

let prisma: PrismaClient;
let removeCartItemsService: typeof removeCartItemsServiceType;
let service: typeof import("./services/cart.service.js");
let close: () => Promise<void>;
let app: express.Express;
let price = "10.00";
let published = true;
let missing = false;
const secret = "fitsupply_test_internal_secret";
const logger = createLogger({ service: "cart-service", environment: "test", level: "silent" });

const databaseUrl = requireTestDatabaseUrl("cart_test_db");

beforeAll(async () => {
  process.env.DATABASE_URL = databaseUrl;
  process.env.GATEWAY_SECRET = "fitsupply_test_internal_secret";

  const dbModule = await import("./config/db.js");
  prisma = dbModule.default;
  close = dbModule.closeDb;
  service = await import("./services/cart.service.js");
  ({ removeCartItemsService } = service);
  app = express(); app.use(express.json(), createGatewaySecretMiddleware(secret));
  app.use((await import("./middleware/user-context.middleware.js")).attachCartUser);
  app.use((await import("./routes/cart.route.js")).default, createErrorHandler(logger));
});

beforeEach(async () => {
  price = "10.00"; published = true; missing = false;
  vi.stubGlobal("fetch", vi.fn(async (url: string) => missing ? new Response("{}", { status: 404 }) : new Response(JSON.stringify({ success: true,
    data: { id: decodeURIComponent(url.split("/").slice(-1)[0]), name: "Current Catalog name", price, isPublished: published, images: [] } }))));
  await cleanupDatabase("cart_test_db", databaseUrl, {
    async execute(sql) {
      await prisma.$executeRawUnsafe(sql);
    },
  });
});
afterAll(async () => { vi.unstubAllGlobals(); if (prisma) { await cleanupDatabase("cart_test_db", databaseUrl, { execute: async (sql) => { await prisma.$executeRawUnsafe(sql); } }); await close(); } });

async function createCart() {
  const cart = await prisma.cart.create({
    data: {
      userId: "user-1",
      items: {
        create: [
          { productId: "product-1", quantity: 2, nameSnapshot: "Protein", priceSnapshot: "10.00" },
          { productId: "product-2", quantity: 1, nameSnapshot: "Creatine", priceSnapshot: "12.00" },
        ],
      },
    },
    include: { items: { orderBy: { productId: "asc" } } },
  });
  await prisma.$executeRaw`UPDATE "Cart" SET "version" = ${2} WHERE "id" = ${cart.id}`;
  return cart;
}

async function getCartVersion(cartId: string) {
  const [row] = await prisma.$queryRaw<Array<{ version: number }>>`SELECT "version" FROM "Cart" WHERE "id" = ${cartId}`;
  return row.version;
}

describe("cart versioned finalization", () => {
  it("removes accepted cart items only when cart id and version match", async () => {
    const cart = await createCart();

    const result = await removeCartItemsService("user-1", {
      cartItemIds: [cart.items[0].id],
      cartId: cart.id,
      cartVersion: 2,
    });

    expect(result.version).toBe(3);
    expect(result.items.map((item) => item.productId)).toEqual(["product-2"]);
  });

  it("rejects stale cart finalization without deleting newer cart state", async () => {
    const cart = await createCart();
    await prisma.$executeRaw`UPDATE "Cart" SET "version" = "version" + 1 WHERE "id" = ${cart.id}`;

    await expect(
      removeCartItemsService("user-1", {
        cartItemIds: [cart.items[0].id],
        cartId: cart.id,
        cartVersion: 2,
      }),
    ).rejects.toMatchObject({ status: 409, message: "Cart changed during checkout" });

    const persisted = await prisma.cart.findUniqueOrThrow({
      where: { id: cart.id },
      include: { items: true },
    });
    expect(persisted.items).toHaveLength(2);
    expect(await getCartVersion(cart.id)).toBe(3);
  });
});

it("concurrent first adds create one cart/item and preserve every increment", async () => {
  await Promise.all(Array.from({ length: 8 }, () => service.addCartItemService("owner", { productId: "product", quantity: 1 })));
  expect(await prisma.cart.count()).toBe(1);
  expect(await prisma.cartItem.count()).toBe(1);
  expect(await service.getUserCartOrEmpty("owner")).toMatchObject({ version: 9, totalItems: 8, items: [{ quantity: 8 }] });
});

it("concurrent increments on an existing item cannot lose a valid update", async () => {
  await service.addCartItemService("owner", { productId: "product", quantity: 2 });
  let entered!: () => void; let release!: () => void;
  const locked = new Promise<void>((resolve) => { entered = resolve; });
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  const blocker = prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${'cart.user:owner'}, 0))`;
    entered(); await barrier;
  });
  await locked;
  const additions = Promise.all([service.addCartItemService("owner", { productId: "product", quantity: 1 }), service.addCartItemService("owner", { productId: "product", quantity: 1 })]);
  try {
    await vi.waitFor(async () => {
      const [row] = await prisma.$queryRaw<Array<{ total: bigint }>>`SELECT COUNT(*) AS total FROM pg_stat_activity WHERE datname=current_database() AND wait_event='advisory'`;
      expect(Number(row.total)).toBeGreaterThanOrEqual(2);
    }, { timeout: 2000, interval: 20 });
  } finally { release(); await blocker; await additions; }
  expect(await prisma.cartItem.findFirstOrThrow()).toMatchObject({ quantity: 4 });
});

it("absolute updates and remove races serialize; absent item stays 404", async () => {
  const cart = await service.addCartItemService("owner", { productId: "product", quantity: 2 });
  const id = cart.items[0].id;
  const result = await Promise.allSettled([service.updateCartItemService("owner", id, { quantity: 4 }), service.deleteCartItemService("owner", id)]);
  expect(result[1].status).toBe("fulfilled");
  if (result[0].status === "rejected") expect(result[0].reason).toMatchObject({ status: 404 });
  expect(await prisma.cartItem.count()).toBe(0);
  await expect(service.deleteCartItemService("owner", id)).rejects.toMatchObject({ status: 404 });
});

it("concurrent checkout cleanup and add preserve newer intent or reject stale version", async () => {
  const cart = await service.addCartItemService("owner", { productId: "product", quantity: 2 });
  const results = await Promise.allSettled([
    service.removeCartItemsService("owner", { cartId: cart.id!, cartVersion: cart.version, cartItemIds: [cart.items[0].id] }),
    service.addCartItemService("owner", { productId: "product", quantity: 1 }),
  ]);
  const current = await prisma.cartItem.findFirstOrThrow();
  if (results[0].status === "fulfilled") expect(current.quantity).toBe(1);
  else { expect(results[0].reason).toMatchObject({ status: 409 }); expect(current.quantity).toBe(3); }
});

it("checkout cleanup receipt survives lost response and cannot remove re-added product", async () => {
  const cart = await service.addCartItemService("owner", { productId: "product", quantity: 2 });
  const input = { cartId: cart.id!, cartVersion: cart.version, cartItemIds: [cart.items[0].id] };
  await Promise.all([service.removeCartItemsService("owner", input), service.removeCartItemsService("owner", input)]);
  const newer = await service.addCartItemService("owner", { productId: "product", quantity: 3 });
  expect(await service.removeCartItemsService("owner", input)).toMatchObject({ version: newer.version, items: [{ quantity: 3 }] });
  expect(await prisma.cartCheckoutRemoval.count()).toBe(1);
  await expect(service.removeCartItemsService("owner", { ...input, cartItemIds: [newer.items[0].id] })).rejects.toMatchObject({ status: 409 });
});

it("PostgreSQL enforces item uniqueness, quantity/price and cart version checks", async () => {
  const cart = await createCart();
  await expect(prisma.cartItem.create({ data: { cartId: cart.id, productId: cart.items[0].productId, quantity: 1, nameSnapshot: "Duplicate", priceSnapshot: "1.00" } })).rejects.toMatchObject({ code: "P2002" });
  await expect(prisma.cartItem.update({ where: { id: cart.items[0].id }, data: { quantity: 0 } })).rejects.toThrow();
  await expect(prisma.cartItem.update({ where: { id: cart.items[0].id }, data: { priceSnapshot: "-1.00" } })).rejects.toThrow();
  await expect(prisma.cart.update({ where: { id: cart.id }, data: { version: 0 } })).rejects.toThrow();
});

it("receipt insertion failure rolls back deletion and version mutation", async () => {
  const cart = await createCart();
  await prisma.$executeRawUnsafe(`CREATE FUNCTION fail_cart_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test receipt failure'; END $$`);
  try {
    await prisma.$executeRawUnsafe(`CREATE TRIGGER fail_cart_receipt BEFORE INSERT ON "CartCheckoutRemoval" FOR EACH ROW EXECUTE FUNCTION fail_cart_receipt()`);
    await expect(service.removeCartItemsService("user-1", { cartId: cart.id, cartVersion: 2, cartItemIds: [cart.items[0].id] })).rejects.toThrow();
    expect(await prisma.cartItem.count()).toBe(2); expect(await getCartVersion(cart.id)).toBe(2);
  } finally {
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS fail_cart_receipt ON "CartCheckoutRemoval"`);
    await prisma.$executeRawUnsafe(`DROP FUNCTION fail_cart_receipt()`);
  }
});

it("API rejects missing identity/secret and foreign mutations without revealing cart contents", async () => {
  const cart = await service.addCartItemService("owner", { productId: "product", quantity: 2 });
  await request(app).get("/").set("x-user-id", "owner").expect(403);
  await request(app).get("/").set("x-internal-secret", secret).expect(401);
  const foreign = await request(app).get("/").set("x-internal-secret", secret).set("x-user-id", "foreign").expect(200);
  expect(foreign.body.items).toEqual([]);
  for (const method of ["patch", "delete"] as const) await request(app)[method](`/items/${cart.items[0].id}`).set("x-internal-secret", secret).set("x-user-id", "foreign").send({ quantity: 4, userId: "owner" }).expect(404);
  await request(app).delete("/internal/cart/items").set("x-internal-secret", secret).set("x-user-id", "foreign").send({ cartItemIds: [cart.items[0].id], cartId: cart.id, cartVersion: cart.version }).expect(404);
  expect(await prisma.cartItem.findFirstOrThrow()).toMatchObject({ quantity: 2 });
});

it("API validates quantities and prevents overflow without partial version changes", async () => {
  for (const quantity of [0, -1, 1.5, true, null, 2_147_483_648]) await request(app).post("/items").set("x-internal-secret", secret).set("x-user-id", "owner").send({ productId: "product", quantity }).expect(400);
  const first = await service.addCartItemService("owner", { productId: "product", quantity: 2_147_483_647 });
  await request(app).delete("/internal/cart/items").set("x-internal-secret", secret).set("x-user-id", "owner")
    .send({ cartId: first.id, cartVersion: 2_147_483_648, cartItemIds: [first.items[0].id] }).expect(409);
  await expect(service.addCartItemService("owner", { productId: "product", quantity: 1 })).rejects.toMatchObject({ status: 400 });
  expect(await service.getUserCartOrEmpty("owner")).toMatchObject({ version: first.version, items: [{ quantity: 2_147_483_647 }] });
});

it("Catalog failures/unpublished products do not persist carts; snapshots refresh only on add", async () => {
  missing = true;
  await expect(service.addCartItemService("owner", { productId: "product", quantity: 1 })).rejects.toMatchObject({ status: 404 });
  missing = false; published = false;
  await expect(service.addCartItemService("owner", { productId: "product", quantity: 1 })).rejects.toMatchObject({ status: 400 });
  expect(await prisma.cart.count()).toBe(0);
  published = true;
  const old = await service.addCartItemService("owner", { productId: "product", quantity: 1 });
  price = "20.00";
  expect(await service.getUserCartOrEmpty("owner")).toMatchObject({ items: [{ unitPrice: 10 }] });
  await service.updateCartItemService("owner", old.items[0].id, { quantity: 2 });
  expect(await service.getUserCartOrEmpty("owner")).toMatchObject({ items: [{ unitPrice: 10 }] });
  expect(await service.addCartItemService("owner", { productId: "product", quantity: 1 })).toMatchObject({ items: [{ unitPrice: 20, quantity: 3 }] });
  await prisma.cartItem.update({ where: { id: old.items[0].id }, data: { createdAt: new Date(0) } });
  await service.addCartItemService("owner", { productId: "second", quantity: 1 });
  expect((await service.addCartItemService("owner", { productId: "product", quantity: 1 })).items.map((item) => item.productId)).toEqual(["product", "second"]);
});

it("malformed or mismatched Catalog responses map to safe 503 with no persistence", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: { id: "different", price: "secret" } }))));
  await expect(service.addCartItemService("owner", { productId: "product", quantity: 1 })).rejects.toMatchObject({ status: 503, message: "Catalog service unavailable", details: undefined });
  expect(await prisma.cart.count()).toBe(0);
});
