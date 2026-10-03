import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const INTERNAL_SECRET_HEADER = "x-internal-secret";

export function requireGatewaySecret(req: Request, res: Response, next: NextFunction) {
  return createGatewaySecretMiddleware(process.env.GATEWAY_SECRET)(req, res, next);
}

export function createGatewaySecretMiddleware(expectedSecret: string | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!expectedSecret) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: { code: "INTERNAL_ERROR", message: "GATEWAY_SECRET is not set" },
      });
    }

    const receivedSecret = req.get(INTERNAL_SECRET_HEADER);
    if (receivedSecret !== expectedSecret) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: { code: "FORBIDDEN", message: "Forbidden" },
      });
    }

    next();
  };
}
