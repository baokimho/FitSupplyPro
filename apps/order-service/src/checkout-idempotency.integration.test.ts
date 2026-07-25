import express from "express";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandler, requireTestDatabaseUrl } from "@shared/utils";
import type { PrismaClient } from "./generated/prisma/index.js";
import type { checkoutOrderService as checkoutOrderServiceType } from "./services/order.service.js";

let prisma: PrismaClient;
let checkoutOrderService: typeof checkoutOrderServiceType;
let app: express.Express;

const databaseUrl = requireTestDatabaseUrl("order_test_db");
const originalFetch = globalThis.fetch;

type Product = {
  id: string;
  name: string;
  slug: string;
  price: string;
  isPublished: boolean;
};

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
};

const products = new Map<string, Product>();
let cartItems: CartItem[] = [];
let reserveCalls: Array<{ productId: string; quantity: number }> = [];
let removeCalls: string[][] = [];
const inventory = new Map<string, { stock: number; reservedStock: number }>();
let reserveDelayMs = 0;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

function setProduct(product: Product) {
  products.set(product.id, product);
}

function setInventory(productId: string, stock: number, reservedStock = 0) {
  inventory.set(productId, { stock, reservedStock });
}

function setCart(items: CartItem[]) {
  cartItems = items;
}

function reserveCount(productId: string) {
  return reserveCalls.filter((call) => call.productId === productId).length;
}

async function countOrders() {
  return prisma.order.count();
}

async function truncateOrderDb() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "CheckoutIdempotency", "OrderItem", "Order" RESTART IDENTITY CASCADE;');
}

function installFetchDouble() {
  vi.stubGlobal("fetch", vi.fn(async (input: string | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";

    if (url.includes("/internal/cart") && method === "GET") {
      return jsonResponse({ id: "cart-1", userId: "user-1", items: cartItems });
    }

    if (url.includes("/internal/cart/items") && method === "DELETE") {
      const body = JSON.parse(String(init?.body ?? "{}")) as { cartItemIds?: string[] };
      removeCalls.push(body.cartItemIds ?? []);
      cartItems = cartItems.filter((item) => !(body.cartItemIds ?? []).includes(item.id));
      return jsonResponse({});
    }

    if (url.includes("/products/batch") && method === "POST") {
      const body = JSON.parse(String(init?.body ?? "{}")) as { productIds?: string[] };
      const items = (body.productIds ?? []).flatMap((productId) => {
        const current = inventory.get(productId);
        if (!current) return [];
        return [{
          productId,
          stock: current.stock,
          reservedStock: current.reservedStock,
          availableStock: current.stock - current.reservedStock,
        }];
      });
      return jsonResponse({ items });
    }

    if (url.includes("/reserve") && method === "POST") {
      const match = url.match(/\/products\/([^/]+)\/reserve/);
      const productId = match?.[1] ?? "";
      const body = JSON.parse(String(init?.body ?? "{}")) as { quantity: number };
      if (reserveDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, reserveDelayMs));
      }
      const current = inventory.get(productId);
      if (!current || current.stock - current.reservedStock < body.quantity) {
        return jsonResponse({ message: "Insufficient stock" }, 400);
      }
      current.reservedStock += body.quantity;
      reserveCalls.push({ productId, quantity: body.quantity });
      return jsonResponse({});
    }

    if (url.includes("/release") && method === "POST") {
      const match = url.match(/\/products\/([^/]+)\/release/);
      const productId = match?.[1] ?? "";
      const body = JSON.parse(String(init?.body ?? "{}")) as { quantity: number };
      const current = inventory.get(productId);
      if (current) current.reservedStock = Math.max(0, current.reservedStock - body.quantity);
      return jsonResponse({});
    }

    const productMatch = url.match(/\/products\/([^/]+)$/);
    if (productMatch && method === "GET") {
      const product = products.get(productMatch[1]);
      if (!product) return jsonResponse({ message: "Product not found" }, 400);
      return jsonResponse({ success: true, data: product });
    }

    if (url.includes("/internal/notifications")) {
      return jsonResponse({});
    }

    return jsonResponse({ message: `Unhandled request: ${method} ${url}` }, 500);
  }));
}

beforeAll(async () => {
  process.env.DATABASE_URL = databaseUrl;
  process.env.GATEWAY_SECRET = "fitsupply_test_internal_secret";
  process.env.CART_SERVICE_URL = "http://cart-service.test";
  process.env.CATALOG_SERVICE_URL = "http://catalog-service.test";
  process.env.INVENTORY_SERVICE_URL = "http://inventory-service.test";
  process.env.NOTIFICATION_SERVICE_URL = "http://notification-service.test";

  installFetchDouble();
  const dbModule = await import("./config/db.js");
  prisma = dbModule.default;
  ({ checkoutOrderService } = await import("./services/order.service.js"));

  const routes = (await import("./routes/order.route.js")).default;
  app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    req.orderUser = { id: "user-1", role: "CUSTOMER" };
    next();
  });
  app.use(routes);
  app.use(errorHandler);
});

beforeEach(async () => {
  await truncateOrderDb();
  products.clear();
  inventory.clear();
  reserveCalls = [];
  removeCalls = [];
  reserveDelayMs = 0;
  setProduct({ id: "product-1", name: "Protein", slug: "protein", price: "10.00", isPublished: true });
  setProduct({ id: "product-2", name: "Creatine", slug: "creatine", price: "12.00", isPublished: true });
  setInventory("product-1", 10);
  setInventory("product-2", 10);
  setCart([{ id: "cart-item-1", productId: "product-1", quantity: 2 }]);
});

describe("checkout idempotency", () => {
  it("creates an order on first successful checkout", async () => {
    const order = await checkoutOrderService("user-1", { cartItemIds: ["cart-item-1"] }, "checkout-key-1");

    expect(order.items).toHaveLength(1);
    expect(order.totalAmount).toBe(20);
    expect(await countOrders()).toBe(1);
    expect(reserveCount("product-1")).toBe(1);
  });

  it("replays the same completed checkout without another order or reservation", async () => {
    const first = await checkoutOrderService("user-1", { cartItemIds: ["cart-item-1"] }, "checkout-key-2");
    setCart([{ id: "cart-item-1", productId: "product-1", quantity: 2 }]);

    const second = await checkoutOrderService("user-1", { cartItemIds: ["cart-item-1"] }, "checkout-key-2");

    expect(second).toMatchObject({ id: first.id, totalAmount: first.totalAmount });
    expect(await countOrders()).toBe(1);
    expect(reserveCount("product-1")).toBe(1);
  });

  it("does not depend on process memory for replay", async () => {
    const first = await checkoutOrderService("user-1", { cartItemIds: ["cart-item-1"] }, "checkout-key-db");
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "should not call downstream" }, 500)));

    const second = await checkoutOrderService("user-1", { cartItemIds: ["cart-item-1"] }, "checkout-key-db");

    expect(second).toMatchObject({ id: first.id });
    expect(globalThis.fetch).not.toHaveBeenCalled();
    installFetchDouble();
  });

  it("executes concurrent duplicate checkout only once", async () => {
    reserveDelayMs = 50;

    const results = await Promise.allSettled([
      checkoutOrderService("user-1", { cartItemIds: ["cart-item-1"] }, "checkout-key-race"),
      checkoutOrderService("user-1", { cartItemIds: ["cart-item-1"] }, "checkout-key-race"),
    ]);

    expect(await countOrders()).toBe(1);
    expect(reserveCount("product-1")).toBe(1);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
  });

  it("rejects same key with different logical input", async () => {
    await checkoutOrderService("user-1", { cartItemIds: ["cart-item-1"] }, "checkout-key-conflict");

    await expect(
      checkoutOrderService("user-1", { cartItemIds: ["cart-item-1", "cart-item-2"] }, "checkout-key-conflict"),
    ).rejects.toMatchObject({ status: 409, message: "Idempotency key was reused with a different request" });
  });

  it("scopes the same idempotency key independently per user", async () => {
    await checkoutOrderService("user-1", { cartItemIds: ["cart-item-1"] }, "shared-key");
    setCart([{ id: "cart-item-1", productId: "product-1", quantity: 2 }]);

    await checkoutOrderService("user-2", { cartItemIds: ["cart-item-1"] }, "shared-key");

    expect(await countOrders()).toBe(2);
    expect(reserveCount("product-1")).toBe(2);
  });

  it("validates missing and invalid idempotency keys", async () => {
    await request(app)
      .post("/orders/checkout")
      .send({ cartItemIds: ["cart-item-1"] })
      .expect(400);

    await request(app)
      .post("/orders/checkout")
      .set("Idempotency-Key", "bad key")
      .send({ cartItemIds: ["cart-item-1"] })
      .expect(400);
  });

  it("keeps existing business errors mapped", async () => {
    await expect(
      checkoutOrderService("user-1", { cartItemIds: ["missing-cart-item"] }, "checkout-key-business-error"),
    ).rejects.toMatchObject({ status: 404, message: "Cart item not found" });

    expect(await countOrders()).toBe(0);
    expect(reserveCalls).toHaveLength(0);
  });
});

afterAll(() => {
  vi.stubGlobal("fetch", originalFetch);
});
