import { initializeAuthKeys } from "./services/auth.service.js";
import express from "express";
import { healthRouter } from "./health.js";
import { logger } from "./logger.js";
import cors from "cors";
import { config } from "./config/index.js";
import prisma from "./config/db.js";
import { connectDb } from "./config/connect-db.js";
import { startRefreshTokenCleanupJob } from "./config/refresh-token-cleanup.js";
import { createGatewaySecretMiddleware } from "@shared/utils";
import authRoutes from "./auth.routes.js";
import { correlationMiddleware, httpLogger, createErrorHandler } from "@shared/utils";



const app = express();

app.use(correlationMiddleware("service"));
app.use(httpLogger(logger));
app.use(healthRouter);

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

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    logger.info({ signal: "SIGTERM" }, "shutdown requested");
    server.close(async () => {
      if (refreshTokenCleanupJob) {
        clearInterval(refreshTokenCleanupJob);
      }

      await prisma.$disconnect();
      process.exit(0);
    });
  });

  process.on("SIGINT", async () => {
    logger.info({ signal: "SIGINT" }, "shutdown requested");
    server.close(async () => {
      if (refreshTokenCleanupJob) {
        clearInterval(refreshTokenCleanupJob);
      }

      await prisma.$disconnect();
      process.exit(0);
    });
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
