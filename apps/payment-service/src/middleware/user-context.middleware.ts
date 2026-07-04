import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "@shared/utils";

export type PaymentRequestUser = {
  id: string;
  role?: string;
};

declare global {
  namespace Express {
    interface Request {
      paymentUser?: PaymentRequestUser;
    }
  }
}

export function attachPaymentUser(req: Request, _res: Response, next: NextFunction) {
  const userId = req.get("x-user-id");

  if (!userId) {
    throw new UnauthorizedError("Missing user context");
  }

  req.paymentUser = {
    id: userId,
    role: req.get("x-user-role") ?? undefined,
  };

  next();
}
