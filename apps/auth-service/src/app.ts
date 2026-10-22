import express from "express";
import cors from "cors";
import { correlationMiddleware, httpLogger, shutdownGuard, createGatewaySecretMiddleware, createErrorHandler } from "@shared/utils";
import { healthRouter, readiness } from "./health.js";
import { logger } from "./logger.js";
import { config } from "./config/index.js";
import authRoutes from "./auth.routes.js";

export function createApp() {
  const app = express();
  app.use(correlationMiddleware("service"), httpLogger(logger), healthRouter, shutdownGuard(readiness));
  app.use(cors(), express.json(), createGatewaySecretMiddleware(config.gatewaySecret), authRoutes);
  app.use((_req, res) => res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } }));
  app.use(createErrorHandler(logger));
  return app;
}
