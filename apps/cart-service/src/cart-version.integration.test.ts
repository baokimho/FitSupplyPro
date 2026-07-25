import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { cleanupDatabase, requireTestDatabaseUrl } from "@shared/utils";
import type { PrismaClient } from "./generated/prisma/index.js";
import type { removeCartItemsService as removeCartItemsServiceType } from "./services/cart.service.js";

let prisma: PrismaClient;
let removeCartItemsService: typeof removeCartItemsServiceType;

const databaseUrl = requireTestDatabaseUrl("cart_test_db");

beforeAll(async () => {
  process.env.DATABASE_URL = databaseUrl;
  process.env.GATEWAY_SECRET = "fitsupply_test_internal_secret";

  const dbModule = await import("./config/db.js");
  prisma = dbModule.default;
  ({ removeCartItemsService } = await import("./services/cart.service.js"));
});

beforeEach(async () => {
  await cleanupDatabase("cart_test_db", databaseUrl, {
    async execute(sql) {
      await prisma.$executeRawUnsafe(sql);
    },
  });
});

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
