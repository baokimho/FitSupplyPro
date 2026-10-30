import { expect, it } from "vitest";
import { addCartItemSchema, updateCartItemSchema } from "./cart.schema.js";

it.each([0, -1, 1.5, NaN, Infinity, 2_147_483_648, true, false, null, [], {}, "", " "])("rejects invalid quantity %j", (quantity) => {
  expect(addCartItemSchema.safeParse({ productId: "product", quantity }).success).toBe(false);
  expect(updateCartItemSchema.safeParse({ quantity }).success).toBe(false);
});
it("preserves positive integer and numeric-string compatibility", () => {
  expect(addCartItemSchema.parse({ productId: "product", quantity: "2" }).quantity).toBe(2);
  expect(updateCartItemSchema.parse({ quantity: 2_147_483_647 }).quantity).toBe(2_147_483_647);
});
