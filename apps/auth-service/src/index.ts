import { initializeAuthKeys } from "./services/auth.service.js";
import express from "express";
import { healthRouter, readiness } from "./health.js";
import { logger } from "./logger.js";
import cors from "cors";
import { config } from "./config/index.js";
import { closeDb } from "./config/db.js";
import { connectDb } from "./config/connect-db.js";
import { startRefreshTokenCleanupJob } from "./config/refresh-token-cleanup.js";
import { createGatewaySecretMiddleware } from "@shared/utils";
import authRoutes from "./auth.routes.js";
import { installShutdown, shutdownGuard, correlationMiddleware, httpLogger, createErrorHandler } from "@shared/utils";



const app = express();

app.use(correlationMiddleware("service"));
app.use(httpLogger(logger));
app.use(healthRouter);
app.use(shutdownGuard(readiness));

app.use(cors());
app.use(express.json());
app.use(createGatewaySecretMiddleware(config.gatewaySecret));
app.use(authRoutes);


const PORT = config.port;
let refreshTokenCleanupJob: NodeJS.Timeout | null = null;

async function bootstrap() {
  await initializeAuthKeys();
  await connectDb();
  refreshTokenCleanupJob = startRefreshTokenCleanupJob();

  const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, "service started");
  });

  installShutdown({
    server, logger, state: readiness,
    stopWork: () => { if (refreshTokenCleanupJob) clearInterval(refreshTokenCleanupJob); },
    cleanup: [closeDb],
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

app.use(createErrorHandler(logger));

bootstrap().catch((error) => {
  logger.fatal({ err: error }, "service startup failed");
  process.exit(1);
});
