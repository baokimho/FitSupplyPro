import { z } from "zod";

export const inventoryProductParamsSchema = z.object({
  productId: z.string().min(1, "Product id is required"),
});

export const createInventorySchema = z.object({
  productId: z.string().min(1, "Product id is required"),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
});

export const updateInventorySchema = z
  .object({
    stock: z.coerce.number().int().min(0).optional(),
    lowStockThreshold: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const batchInventorySchema = z.object({
  productIds: z
    .array(z.string().min(1, "Product id is required"))
    .min(1, "At least one product id is required")
    .max(100, "A maximum of 100 product ids is allowed"),
});

export const adjustInventorySchema = z.object({
  quantity: z.coerce
    .number()
    .int()
    .refine((value) => value !== 0, "Quantity must not be 0"),
  reason: z.string().min(1, "Reason is required"),
});

export const reserveInventorySchema = z.object({
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
});

export const releaseInventorySchema = z.object({
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
});

export const consumeInventorySchema = z.object({
  quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
});

export type InventoryProductParams = z.infer<typeof inventoryProductParamsSchema>;
export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type BatchInventoryInput = z.infer<typeof batchInventorySchema>;
export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
export type ReserveInventoryInput = z.infer<typeof reserveInventorySchema>;
export type ReleaseInventoryInput = z.infer<typeof releaseInventorySchema>;
export type ConsumeInventoryInput = z.infer<typeof consumeInventorySchema>;
