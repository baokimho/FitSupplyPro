import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getParam } from "@shared/utils";
import {
  createNotificationService,
  getMyNotificationsService,
  markAllNotificationsReadService,
  markNotificationReadService,
} from "../services/notification.service.js";
import type {
  CreateNotificationInput,
  NotificationParamsInput,
} from "../validations/notification.schema.js";

const getUserId = (req: Request) => {
  const userId = req.notificationUser?.id;

  if (!userId) {
    throw new Error("Missing notification user");
  }

  return userId;
};

export const createNotification = async (
  req: Request<{}, {}, CreateNotificationInput>,
  res: Response,
) => {
  const notification = await createNotificationService(req.body);
  res.status(StatusCodes.CREATED).json(notification);
};

export const getMyNotifications = async (req: Request, res: Response) => {
  const notifications = await getMyNotificationsService(getUserId(req));
  res.status(StatusCodes.OK).json({ items: notifications });
};

export const markNotificationRead = async (
  req: Request<NotificationParamsInput>,
  res: Response,
) => {
  const notification = await markNotificationReadService(getParam(req, "id"), getUserId(req));
  res.status(StatusCodes.OK).json(notification);
};

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  const notifications = await markAllNotificationsReadService(getUserId(req));
  res.status(StatusCodes.OK).json({ items: notifications });
};
