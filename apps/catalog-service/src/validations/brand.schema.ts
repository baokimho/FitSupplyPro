import { z } from "zod";

export const createBrandSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

export const updateBrandSchema = createBrandSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const brandParamsSchema = z.object({
  id: z.string().min(1, "Brand id is required"),
});

export type BrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
export type BrandParams = z.infer<typeof brandParamsSchema>;
