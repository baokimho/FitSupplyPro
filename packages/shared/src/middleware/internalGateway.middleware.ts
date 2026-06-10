import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const INTERNAL_SECRET_HEADER = "x-internal-secret";

export function requireGatewaySecret(req: Request, res: Response, next: NextFunction) {
  const expectedSecret = process.env.GATEWAY_SECRET;

  if (!expectedSecret) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "GATEWAY_SECRET is not set",
    });
  }

  const receivedSecret = req.get(INTERNAL_SECRET_HEADER);
  if (receivedSecret !== expectedSecret) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "Forbidden",
    });
  }

  next();
}
