import { describe, expect, it } from "vitest";
import {
  buildBrand,
  buildCart,
  buildCartItem,
  buildCategory,
  buildInventory,
  buildNotification,
  buildOrder,
  buildOrderItem,
  buildPayment,
  buildProduct,
  buildRefreshToken,
  buildShipment,
  buildUser,
  cleanupDatabase,
  createFactoryContext,
  getCleanupTables,
} from "../index.js";

describe("test data factories", () => {
  it("builds valid defaults for current persisted entities", () => {
    const context = createFactoryContext();

    expect(buildUser({}, context)).toMatchObject({ email: "user-1@example.test", role: "CUSTOMER" });
    expect(buildRefreshToken({ userId: "user-id" }, context).userId).toBe("user-id");
    expect(buildCategory({}, context)).toMatchObject({ slug: "test-category-1" });
    expect(buildBrand({}, context)).toMatchObject({ slug: "test-brand-1" });
    expect(buildProduct({ categoryId: "cat", brandId: "brand" }, context)).toMatchObject({
      sku: "TEST-SKU-1",
      categoryId: "cat",
      brandId: "brand",
    });
    expect(buildInventory({}, context)).toMatchObject({ stock: 25, reservedStock: 0 });
    expect(buildOrder({}, context)).toMatchObject({ status: "PENDING" });
    expect(buildOrderItem({}, context)).toMatchObject({ quantity: 1 });
    expect(buildCart({}, context)).toMatchObject({ userId: "test-user-1" });
    expect(buildCartItem({}, context)).toMatchObject({ quantity: 1 });
    expect(buildPayment({}, context)).toMatchObject({ status: "PENDING", provider: "MOCK" });
    expect(buildShipment({}, context)).toMatchObject({ status: "PENDING", country: "US" });
    expect(buildNotification({}, context)).toMatchObject({ type: "ORDER_CREATED", isRead: false });
  });

  it("honors explicit overrides", () => {
    expect(buildUser({ email: "override@example.test", role: "ADMIN" })).toMatchObject({
      email: "override@example.test",
      role: "ADMIN",
    });
    expect(buildProduct({ sku: "SKU-OVERRIDE", price: "42.50" })).toMatchObject({
      sku: "SKU-OVERRIDE",
      price: "42.50",
    });
  });

  it("generates deterministic unique fields", () => {
    const context = createFactoryContext();
    const first = buildProduct({}, context);
    const second = buildProduct({}, context);

    expect(first.sku).toBe("TEST-SKU-1");
    expect(second.sku).toBe("TEST-SKU-2");
    expect(first.slug).not.toBe(second.slug);
  });
});

describe("database cleanup", () => {
  it("uses foreign-key-safe cleanup ordering", () => {
    expect(getCleanupTables("auth_test_db")).toEqual(["RefreshToken", "User"]);
    expect(getCleanupTables("order_test_db")).toEqual(["OrderItem", "Order"]);
    expect(getCleanupTables("cart_test_db")).toEqual(["CartItem", "Cart"]);
    expect(getCleanupTables("catalog_test_db")).toEqual(["Product", "Category", "Brand"]);
  });

  it("cleans created rows through the safe executor path", async () => {
    const rows = new Map<string, string[]>([
      ["Order", ["order-1"]],
      ["OrderItem", ["item-1"]],
    ]);

    await cleanupDatabase(
      "order_test_db",
      "postgresql://fitsupply_test:fitsupply_test@localhost:55433/order_test_db",
      {
        async execute(sql) {
          expect(sql).toBe('TRUNCATE TABLE "OrderItem", "Order" RESTART IDENTITY CASCADE;');
          rows.get("OrderItem")?.splice(0);
          rows.get("Order")?.splice(0);
        },
      },
    );

    expect(rows.get("OrderItem")).toEqual([]);
    expect(rows.get("Order")).toEqual([]);
  });

  it("rejects unsafe database URLs before cleanup", async () => {
    await expect(
      cleanupDatabase("auth_test_db", "postgresql://fitsupply:fitsupply@localhost:5433/auth_db", {
        async execute() {
          throw new Error("should not execute");
        },
      }),
    ).rejects.toThrow("auth_test_db DATABASE_URL must target auth_test_db");
  });
});