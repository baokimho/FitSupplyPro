import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createErrorHandler, requireGatewaySecret, createLogger, parseNodeEnv, httpLogger, correlationMiddleware, installShutdown, shutdownGuard, createHealthRouter, readRabbitMqConfig, startOutboxOnlyMessaging } from "@shared/utils";
import prisma, { closeDb } from "./config/db.js";
import { connectDb } from "./config/connect-db.js";
import { attachShippingUser } from "./middleware/user-context.middleware.js";
import shippingRoutes from "./routes/shipping.route.js";
import { registerShippingMetrics } from "./metrics.js";

dotenv.config();

if (!process.env.GATEWAY_SECRET) {
  throw new Error("GATEWAY_SECRET is not set");
}

const app = express();
const logger = createLogger({ service: "shipping-service", environment: parseNodeEnv("NODE_ENV", process.env.NODE_ENV, "development") });
const readiness = { stopping: false };
registerShippingMetrics(prisma);
app.use(correlationMiddleware("service"), httpLogger(logger));
app.use(createHealthRouter({ service: "shipping-service", logger, isReady: () => !readiness.stopping, checkReady: () => prisma.$queryRaw`SELECT 1` }));
app.use(shutdownGuard(readiness));

app.use(cors());
app.use(express.json());
app.use(requireGatewaySecret);
app.use(attachShippingUser);
app.use(shippingRoutes);

app.use((_req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

app.use(createErrorHandler(logger));

const PORT = process.env.PORT || 3007;

async function bootstrap() {
  let messaging: Awaited<ReturnType<typeof startOutboxOnlyMessaging>> | undefined;
  try {
    await connectDb();
    if (process.env.RABBITMQ_URL) messaging = await startOutboxOnlyMessaging(readRabbitMqConfig(), logger, prisma);

    const server = app.listen(PORT, () => {
      console.log(`Shipping service running on port ${PORT}`);
    });
    installShutdown({ server, logger, state: readiness, stopWork: () => messaging?.stop(), cleanup: [...(messaging ? [messaging.close] : []), closeDb] });
  } catch (err) {
    await messaging?.close();
    await closeDb();
    logger.fatal({ err }, "service startup failed");
    process.exitCode = 1;
  }
}

void bootstrap();
