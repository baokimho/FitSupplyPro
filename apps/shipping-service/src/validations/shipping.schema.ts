import { z } from "zod";

export const shipmentParamsSchema = z.object({
  id: z.string().min(1, "Shipment id is required"),
});

export const createShipmentSchema = z.object({
  orderId: z.string().min(1, "Order id is required"),
}).strict();

export const updateShipmentStatusSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  trackingNumber: z.string().min(1, "Tracking number is required").max(128)
    .refine((value) => Array.from(value).every((char) => char.charCodeAt(0) >= 32 && char.charCodeAt(0) !== 127), "Tracking number must not contain control characters")
    .refine((value) => value.trim() === value && value.trim().length > 0, "Tracking number must not be blank or padded").optional(),
});

export type ShipmentParamsInput = z.infer<typeof shipmentParamsSchema>;
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentStatusInput = z.infer<typeof updateShipmentStatusSchema>;
