import { z } from "zod";

export const notificationParamsSchema = z.object({
  id: z.string().min(1, "Notification id is required"),
});

export const createNotificationSchema = z.object({
  userId: z.string().min(1, "User id is required"),
  type: z.enum([
    "ORDER_CREATED",
    "PAYMENT_PAID",
    "PAYMENT_FAILED",
    "ORDER_SHIPPED",
    "ORDER_DELIVERED",
    "ORDER_CANCELLED",
  ]),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
});

export type NotificationParamsInput = z.infer<typeof notificationParamsSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
