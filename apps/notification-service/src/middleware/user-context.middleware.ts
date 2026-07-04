import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "@shared/utils";

export type NotificationRequestUser = {
  id: string;
  role?: string;
};

declare global {
  namespace Express {
    interface Request {
      notificationUser?: NotificationRequestUser;
    }
  }
}

export function attachNotificationUser(req: Request, _res: Response, next: NextFunction) {
  if (req.path.startsWith("/internal/")) {
    next();
    return;
  }

  const userId = req.get("x-user-id");

  if (!userId) {
    throw new UnauthorizedError("Missing user context");
  }

  req.notificationUser = {
    id: userId,
    role: req.get("x-user-role") ?? undefined,
  };

  next();
}
