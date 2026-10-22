import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import type { Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { config } from "../config/index.js";

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
  };
};

const standardRateLimitOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => req.method === "OPTIONS",
  handler: (_req: Request, res: Response) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      error: { code: "TOO_MANY_REQUESTS", message: "Too many requests" },
    });
  },
} as const;

const clientIpKeyGenerator = (req: Request) => {
  return ipKeyGenerator(req.ip ?? "")
};

const authenticatedUserKeyGenerator = (req: Request) => {
  const authenticatedRequest = req as AuthenticatedRequest
  return authenticatedRequest.user?.id || clientIpKeyGenerator(req)
};

function createLimiter(windowMs: number, limit: number, keyGenerator: (req: Request) => string): RequestHandler {
  return rateLimit({
    windowMs,
    limit,
    keyGenerator,
    ...standardRateLimitOptions,
  });
}

export const generalLimiter = createLimiter(config.rateWindowMs, config.rateLimit, clientIpKeyGenerator);
export const authLimiter = createLimiter(config.rateWindowMs, config.authRateLimit, clientIpKeyGenerator);
export const refreshTokenLimiter = createLimiter(config.rateWindowMs, config.refreshRateLimit, clientIpKeyGenerator);
export const catalogLimiter = createLimiter(config.rateWindowMs, 300, authenticatedUserKeyGenerator);
export const inventoryLimiter = createLimiter(config.rateWindowMs, 300, authenticatedUserKeyGenerator);
export const cartLimiter = createLimiter(config.rateWindowMs, 100, authenticatedUserKeyGenerator);
export const orderLimiter = createLimiter(config.rateWindowMs, 50, authenticatedUserKeyGenerator);
export const paymentLimiter = createLimiter(config.rateWindowMs, 50, authenticatedUserKeyGenerator);
export const shippingLimiter = createLimiter(config.rateWindowMs, 50, authenticatedUserKeyGenerator);
export const notificationLimiter = createLimiter(config.rateWindowMs, 100, authenticatedUserKeyGenerator);
