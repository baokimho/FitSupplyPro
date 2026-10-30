import { z } from "zod";

const quantitySchema = z.union([z.number(), z.string().min(1)]).transform(Number).pipe(
  z.number().int().positive("Quantity must be greater than 0").max(2_147_483_647),
);

export const cartItemParamsSchema = z.object({
  id: z.string().min(1, "Cart item id is required"),
});

export const addCartItemSchema = z.object({
  productId: z.string().min(1, "Product id is required"),
  quantity: quantitySchema,
});

export const updateCartItemSchema = z.object({
  quantity: quantitySchema,
});

export const removeCartItemsSchema = z.object({
  cartItemIds: z.array(z.string().min(1, "Cart item id is required")).min(1, "Cart item ids must not be empty"),
  cartId: z.string().min(1, "Cart id is required").optional(),
  cartVersion: z.coerce.number().int().positive("Cart version must be greater than 0").optional(),
});

export type CartItemParamsInput = z.infer<typeof cartItemParamsSchema>;
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type RemoveCartItemsInput = z.infer<typeof removeCartItemsSchema>;

