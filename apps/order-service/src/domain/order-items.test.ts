import { describe, expect, it } from "vitest";
import { aggregateOrderItems } from "./order-items.js";
import { createOrderSchema, maxOrderQuantity, orderParamsSchema } from "../validations/order.schema.js";

const delivery = { recipientName: "Test", contactPhone: "+3581234567", addressLine1: "Street 1",
  city: "Helsinki", postalCode: "00100", countryCode: "FI" };

describe("order contents", () => {
  it.each([0, -1, 1.5, NaN, Infinity, true, null, [], "", maxOrderQuantity + 1])("rejects quantity %j", (quantity) => {
    expect(createOrderSchema.safeParse({ items: [{ productId: "p", quantity }], delivery }).success).toBe(false);
  });
  it("rejects empty contents and blank IDs", () => {
    expect(createOrderSchema.safeParse({ items: [], delivery }).success).toBe(false);
    expect(createOrderSchema.safeParse({ items: [{ productId: "  ", quantity: 1 }], delivery }).success).toBe(false);
    expect(orderParamsSchema.safeParse({ id: "  " }).success).toBe(false);
  });
  it("preserves numeric string compatibility and ignores client authority fields", () => {
    const body = createOrderSchema.parse({ userId: "spoof", totalAmount: 0, status: "DELIVERED",
      items: [{ productId: "p", quantity: "2", price: 0, productName: "spoof" }], delivery });
    expect(body.items).toEqual([{ productId: "p", quantity: 2 }]);
    expect(body).not.toHaveProperty("userId");
    expect(body).not.toHaveProperty("totalAmount");
    expect(body).not.toHaveProperty("status");
  });
  it("aggregates duplicates before reservation", () => {
    expect([...aggregateOrderItems([{ productId: "A", quantity: 2 }, { productId: "A", quantity: 3 },
      { productId: "B", quantity: 1 }])]).toEqual([["A", 5], ["B", 1]]);
  });
  it("rejects aggregate overflow", () => {
    expect(() => aggregateOrderItems([{ productId: "A", quantity: maxOrderQuantity },
      { productId: "A", quantity: 1 }])).toThrow("Quantity is too large");
  });
});
