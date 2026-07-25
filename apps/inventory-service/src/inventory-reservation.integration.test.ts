import express from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  buildInventory,
  cleanupDatabase,
  errorHandler,
  requireTestDatabaseUrl,
} from "@shared/utils";
import type { PrismaClient } from "./generated/prisma/index.js";
import type { reserveInventoryStockService as reserveInventoryStockServiceType } from "./services/inventory.service.js";

let prisma: PrismaClient;
let reserveInventoryStockService: typeof reserveInventoryStockServiceType;
let app: express.Express;

const databaseUrl = requireTestDatabaseUrl("inventory_test_db");

async function getInventory(productId: string) {
  const inventory = await prisma.inventory.findUniqueOrThrow({ where: { productId } });
  return {
    stock: inventory.stock,
    reservedStock: inventory.reservedStock,
    availableStock: inventory.stock - inventory.reservedStock,
  };
}

async function createInventory(overrides: Parameters<typeof buildInventory>[0] = {}) {
  const inventory = buildInventory(overrides);
  await prisma.inventory.create({ data: inventory });
  return inventory;
}

beforeAll(async () => {
  process.env.DATABASE_URL = databaseUrl;
  process.env.GATEWAY_SECRET = "fitsupply_test_internal_secret";

  const dbModule = await import("./config/db.js");
  prisma = dbModule.default;
  ({ reserveInventoryStockService } = await import("./services/inventory.service.js"));

  const routes = (await import("./routes/inventory.route.js")).default;
  app = express();
  app.use(express.json());
  app.use(routes);
  app.use(errorHandler);
});

beforeEach(async () => {
  await cleanupDatabase("inventory_test_db", databaseUrl, {
    async execute(sql) {
      await prisma.$executeRawUnsafe(sql);
    },
  });
});

describe("reserveInventoryStockService", () => {
  it("reserves stock atomically and returns remaining availability", async () => {
    const inventory = await createInventory({ productId: "reserve-success", stock: 10, reservedStock: 2 });

    const result = await reserveInventoryStockService(inventory.productId, {
      quantity: 3,
      reason: "checkout",
    });

    expect(result).toMatchObject({
      productId: inventory.productId,
      stock: 10,
      reservedStock: 5,
      availableStock: 5,
    });
    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 10,
      reservedStock: 5,
      availableStock: 5,
    });
  });

  it("allows reserving exactly the remaining availability", async () => {
    const inventory = await createInventory({ productId: "reserve-exact", stock: 8, reservedStock: 3 });

    const result = await reserveInventoryStockService(inventory.productId, {
      quantity: 5,
      reason: "checkout",
    });

    expect(result).toMatchObject({ stock: 8, reservedStock: 8, availableStock: 0 });
  });

  it("rejects insufficient availability and leaves state unchanged", async () => {
    const inventory = await createInventory({ productId: "reserve-insufficient", stock: 5, reservedStock: 4 });

    await expect(
      reserveInventoryStockService(inventory.productId, { quantity: 2, reason: "checkout" }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Insufficient stock",
      details: { productId: inventory.productId, availableStock: 1, requestedQuantity: 2 },
    });

    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 5,
      reservedStock: 4,
      availableStock: 1,
    });
  });

  it("returns not found for missing inventory", async () => {
    await expect(
      reserveInventoryStockService("missing-product", { quantity: 1, reason: "checkout" }),
    ).rejects.toMatchObject({ status: 404, message: "Inventory not found" });
  });

  it("rejects invalid quantities before reaching service mutation", async () => {
    const inventory = await createInventory({ productId: "reserve-invalid", stock: 5, reservedStock: 0 });

    await request(app)
      .post(`/products/${inventory.productId}/reserve`)
      .send({ quantity: 0, reason: "checkout" })
      .expect(400);

    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 5,
      reservedStock: 0,
      availableStock: 5,
    });
  });

  it("prevents competing reservations from oversubscribing availability", async () => {
    const inventory = await createInventory({ productId: "reserve-race", stock: 5, reservedStock: 0 });

    const results = await Promise.allSettled(
      Array.from({ length: 6 }, () =>
        reserveInventoryStockService(inventory.productId, { quantity: 1, reason: "checkout" }),
      ),
    );

    const successes = results.filter((result) => result.status === "fulfilled");
    const failures = results.filter((result) => result.status === "rejected");

    expect(successes).toHaveLength(5);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toMatchObject({
      reason: { status: 400, message: "Insufficient stock" },
    });
    await expect(getInventory(inventory.productId)).resolves.toEqual({
      stock: 5,
      reservedStock: 5,
      availableStock: 0,
    });
  });
});
