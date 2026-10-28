import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler, createGatewaySecretMiddleware, createLogger, httpLogger, correlationMiddleware, installShutdown, shutdownGuard, createHealthRouter, startInboxMessaging } from "@shared/utils";
import prisma, { closeDb } from "./config/db.js";
import { connectDb } from "./config/connect-db.js";
import { attachNotificationUser } from "./middleware/user-context.middleware.js";
import notificationRoutes from "./routes/notification.route.js";
import { loadConfig } from "./config/env.js";
import { notificationEventTypes } from "./domain/notification.js";
import { acceptNotificationEvent } from "./services/notification-consumer.js";
import { FakeEmailProvider } from "./providers/email-provider.js";
import { startEmailWorker } from "./services/delivery-worker.js";
import { registerNotificationMetrics } from "./metrics.js";

dotenv.config();

const config = loadConfig(process.env);

const app = express();
const logger = createLogger({ service: "notification-service", environment: config.nodeEnv, level: config.logLevel });
const readiness = { stopping: false, brokerReady: () => false };
registerNotificationMetrics(prisma);
app.use(correlationMiddleware("service"), httpLogger(logger));
app.use(createHealthRouter({ service: "notification-service", logger,
  isReady: () => !readiness.stopping && readiness.brokerReady(), checkReady: () => prisma.$queryRaw`SELECT 1` }));
app.use(shutdownGuard(readiness));

app.use(cors());
app.use(express.json());
app.use(createGatewaySecretMiddleware(config.gatewaySecret));
app.use(attachNotificationUser);
app.use(notificationRoutes);

app.use((_req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

app.use(errorHandler);

async function bootstrap() {
  let messaging: Awaited<ReturnType<typeof startInboxMessaging>> | undefined;
  let worker: ReturnType<typeof startEmailWorker> | undefined;
  try {
    await connectDb();
    messaging = await startInboxMessaging(config.broker, logger, "notification.order-events", notificationEventTypes,
      (event) => acceptNotificationEvent(prisma, event, logger), prisma);
    readiness.brokerReady = messaging.isReady;
    worker = startEmailWorker(prisma, new FakeEmailProvider(prisma), logger, config.emailPolicy);
    const server = app.listen(config.port, () => logger.info({ port: config.port }, "service started"));
    installShutdown({ server, logger, state: readiness, stopWork: () => { messaging?.stop(); worker?.stop(); },
      cleanup: [messaging.close, worker.close, closeDb] });
  } catch {
    await messaging?.close();
    await worker?.close();
    await closeDb();
    logger.fatal({ failureCode: "NOTIFICATION_STARTUP_FAILED" }, "service startup failed");
    process.exitCode = 1;
  }
}

void bootstrap();
