import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "@shared/utils";

export type CartRequestUser = {
  id: string;
  role?: string;
};

declare global {
  namespace Express {
    interface Request {
      cartUser?: CartRequestUser;
    }
  }
}

export function attachCartUser(req: Request, _res: Response, next: NextFunction) {
  const userId = req.get("x-user-id");

  if (!userId) {
    throw new UnauthorizedError("Missing user context");
  }

  req.cartUser = {
    id: userId,
    role: req.get("x-user-role") ?? undefined,
  };

  next();
}
