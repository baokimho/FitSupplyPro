import { z } from "zod";

const uuidSchema = z.string().uuid("Order id must be a valid UUID");

export const paymentParamsSchema = z.object({
  id: z.string().min(1, "Payment id is required"),
});

export const createPaymentSchema = z.object({
  orderId: uuidSchema,
}).strict();

export type PaymentParamsInput = z.infer<typeof paymentParamsSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
