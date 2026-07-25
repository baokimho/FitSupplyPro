import { z } from "zod";

export const orderParamsSchema = z.object({
  id: z.string().min(1, "Order id is required"),
});

const trimmedString = (field: string, max: number) =>
  z.string().trim().min(1, `${field} is required`).max(max, `${field} is too long`);

export const deliveryDetailsSchema = z.object({
  recipientName: trimmedString("Recipient name", 120),
  contactPhone: trimmedString("Contact phone", 40).regex(/^[+0-9() .'-]{7,40}$/, "Contact phone is invalid"),
  addressLine1: trimmedString("Address line 1", 160),
  addressLine2: z
    .preprocess(
      (value) => (typeof value === "string" ? value.trim() : value),
      z.string().max(160, "Address line 2 is too long").optional(),
    )
    .transform((value) => (value === "" ? undefined : value)),
  city: trimmedString("City", 100),
  region: z
    .preprocess(
      (value) => (typeof value === "string" ? value.trim() : value),
      z.string().max(100, "Region is too long").optional(),
    )
    .transform((value) => (value === "" ? undefined : value)),
  postalCode: trimmedString("Postal code", 32).regex(/^[\p{L}\p{N} .-]{2,32}$/u, "Postal code is invalid"),
  countryCode: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
    z.string().regex(/^[A-Z]{2}$/, "Country code must be a two-letter ISO country code"),
  ),
}).strict();

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product id is required"),
        quantity: z.coerce.number().int().positive("Quantity must be greater than 0"),
      }),
    )
    .min(1, "Items must not be empty"),
  delivery: deliveryDetailsSchema,
});

export const checkoutSchema = z.object({
  cartItemIds: z
    .array(z.string().min(1, "Cart item id is required"))
    .min(1, "Cart item ids must not be empty"),
  delivery: deliveryDetailsSchema,
});

export type OrderParamsInput = z.infer<typeof orderParamsSchema>;
export type DeliveryDetailsInput = z.infer<typeof deliveryDetailsSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;

