import { z } from "zod";

export const paymentParamsSchema = z.object({
  id: z.string().min(1, "Payment id is required"),
});

export const createPaymentSchema = z.object({
  orderId: z.string().min(1, "Order id is required"),
});

export type PaymentParamsInput = z.infer<typeof paymentParamsSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
