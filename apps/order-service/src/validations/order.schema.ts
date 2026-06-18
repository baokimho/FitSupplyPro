import { z } from "zod";

export const orderParamsSchema = z.object({
  id: z.string().min(1, "Order id is required"),
});

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product id is required"),
        quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
      }),
    )
    .min(1, "Items must not be empty"),
});

export type OrderParamsInput = z.infer<typeof orderParamsSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
