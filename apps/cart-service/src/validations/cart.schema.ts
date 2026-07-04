import { z } from "zod";

export const cartItemParamsSchema = z.object({
  id: z.string().min(1, "Cart item id is required"),
});

export const addCartItemSchema = z.object({
  productId: z.string().min(1, "Product id is required"),
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
});

export const removeCartItemsSchema = z.object({
  cartItemIds: z.array(z.string().min(1, "Cart item id is required")).min(1, "Cart item ids must not be empty"),
});

export type CartItemParamsInput = z.infer<typeof cartItemParamsSchema>;
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type RemoveCartItemsInput = z.infer<typeof removeCartItemsSchema>;
