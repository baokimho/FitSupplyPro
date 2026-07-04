import { z } from "zod";

export const shipmentParamsSchema = z.object({
  id: z.string().min(1, "Shipment id is required"),
});

export const createShipmentSchema = z.object({
  orderId: z.string().min(1, "Order id is required"),
  recipientName: z.string().min(1, "Recipient name is required"),
  phone: z.string().min(1, "Phone is required"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

export const updateShipmentStatusSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  trackingNumber: z.string().min(1, "Tracking number is required").optional(),
});

export type ShipmentParamsInput = z.infer<typeof shipmentParamsSchema>;
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type UpdateShipmentStatusInput = z.infer<typeof updateShipmentStatusSchema>;
