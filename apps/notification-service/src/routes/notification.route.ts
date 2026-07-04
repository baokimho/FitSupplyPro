import { Router } from "express";
import { validateRequest, wrapAsync } from "@shared/utils";
import {
  createNotification,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notification.controller.js";
import {
  createNotificationSchema,
  notificationParamsSchema,
} from "../validations/notification.schema.js";

const router = Router();

router.post(
  "/internal/notifications",
  validateRequest("body", createNotificationSchema),
  wrapAsync(createNotification),
);
router.get("/notifications/me", wrapAsync(getMyNotifications));
router.patch(
  "/notifications/:id/read",
  validateRequest("params", notificationParamsSchema),
  wrapAsync(markNotificationRead),
);
router.patch("/notifications/read-all", wrapAsync(markAllNotificationsRead));

export default router;
