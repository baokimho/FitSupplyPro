import express from "express";
import cors from "cors";
import helmet from "helmet";
import { correlationMiddleware, httpLogger, shutdownGuard, createErrorHandler, ForbiddenError } from "@shared/utils";
import { healthRouter, readiness } from "./health.js";
import { logger } from "./logger.js";
import { config } from "./config/index.js";
import router from "./routes.js";
import { generalLimiter } from "./middleware/rateLimit.middleware.js";
import { parserErrorHandler, readRequestBody, validateJsonBody, validateRequestTarget } from "./middleware/boundary.middleware.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  // Direct edge only: forwarded IP/protocol/host are never client authority.
  app.set("trust proxy", false);
  app.use(correlationMiddleware("gateway"), httpLogger(logger));
  app.use(helmet());
  app.use(validateRequestTarget);
  app.use(cors({
    origin: (origin, done) => done(origin === undefined || config.corsOrigins.includes(origin) ? null : new ForbiddenError("Origin not allowed"), true),
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["authorization", "content-type", "accept", "if-none-match", "if-match", "idempotency-key", "x-request-id"],
    exposedHeaders: ["x-request-id", "ratelimit-limit", "ratelimit-remaining", "ratelimit-reset", "retry-after"],
    credentials: false,
  }));
  app.use(healthRouter);
  app.use(shutdownGuard(readiness), generalLimiter, readRequestBody, validateJsonBody, router);
  app.use(parserErrorHandler, createErrorHandler(logger));
  return app;
}
