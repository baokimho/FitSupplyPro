import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "@shared/utils";

export type OrderRequestUser = {
  id: string;
  role?: string;
};

declare global {
  namespace Express {
    interface Request {
      orderUser?: OrderRequestUser;
    }
  }
}

export function attachOrderUser(req: Request, _res: Response, next: NextFunction) {
  if (req.path.startsWith("/internal/")) {
    next();
    return;
  }

  const userId = req.get("x-user-id");

  if (!userId) {
    throw new UnauthorizedError("Missing user context");
  }

  req.orderUser = {
    id: userId,
    role: req.get("x-user-role") ?? undefined,
  };

  next();
}
