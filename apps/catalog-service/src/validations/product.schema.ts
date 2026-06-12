import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  sku: z.string().min(1, "SKU is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  images: z.array(z.string().min(1)).default([]),
  isPublished: z.boolean().default(false),
  categoryId: z.string().min(1, "Category is required"),
});

export const updateProductSchema = createProductSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const getProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  categoryId: z.string().optional(),
  search: z.string().optional(),
  isPublished: z.coerce.boolean().optional(),
  sort: z
  .enum(["price_asc", "price_desc", "newest", "oldest"])
  .optional()
})

export const productParamsSchema = z.object({
  id: z.string().min(1, "Product id is required"),
});

export type ProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof getProductQuerySchema>;
export type ProductParamsInput = z.infer<typeof productParamsSchema>;