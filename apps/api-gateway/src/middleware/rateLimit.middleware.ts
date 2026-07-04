import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import type { Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";

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
      message: "Too many requests",
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

export const authLimiter = createLimiter(60_000, 5, clientIpKeyGenerator);
export const refreshTokenLimiter = createLimiter(60_000, 30, clientIpKeyGenerator);
export const catalogLimiter = createLimiter(60_000, 300, authenticatedUserKeyGenerator);
export const inventoryLimiter = createLimiter(60_000, 300, authenticatedUserKeyGenerator);
export const cartLimiter = createLimiter(60_000, 100, authenticatedUserKeyGenerator);
export const orderLimiter = createLimiter(60_000, 50, authenticatedUserKeyGenerator);
