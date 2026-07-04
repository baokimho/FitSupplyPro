import { ForbiddenError, NotFoundError } from "@shared/utils";
import type { Prisma } from "../generated/prisma/index.js";
import prisma from "../config/db.js";
import type { CreateNotificationInput } from "../validations/notification.schema.js";

type NotificationWithScalars = Prisma.NotificationGetPayload<Record<string, never>>;

const toNotificationResponse = (notification: NotificationWithScalars) => ({
  id: notification.id,
  userId: notification.userId,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  isRead: notification.isRead,
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt,
});

const getNotificationByIdOrThrow = async (id: string) => {
  const notification = await prisma.notification.findUnique({ where: { id } });

  if (!notification) {
    throw new NotFoundError("Notification not found");
  }

  return notification;
};

export const createNotificationService = async (body: CreateNotificationInput) => {
  const notification = await prisma.notification.create({ data: body });
  return toNotificationResponse(notification);
};

export const getMyNotificationsService = async (userId: string) => {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return notifications.map(toNotificationResponse);
};

export const markNotificationReadService = async (id: string, userId: string) => {
  const notification = await getNotificationByIdOrThrow(id);

  if (notification.userId !== userId) {
    throw new ForbiddenError("Forbidden");
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return toNotificationResponse(updated);
};

export const markAllNotificationsReadService = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return getMyNotificationsService(userId);
};
