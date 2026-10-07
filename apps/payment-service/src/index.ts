import express from "express";
import cors from "cors";
import { installShutdown, shutdownGuard, correlationMiddleware, httpLogger, createErrorHandler, createGatewaySecretMiddleware } from "@shared/utils";
import { closeDb } from "./config/db.js";
import { config } from "./config/index.js";
import { connectDb } from "./config/connect-db.js";
import { logger } from "./logger.js";
import { healthRouter, readiness } from "./health.js";
import { attachPaymentUser } from "./middleware/user-context.middleware.js";
import paymentRoutes from "./routes/payment.route.js";

const app = express();
app.use(correlationMiddleware("service"));
app.use(httpLogger(logger));
app.use(healthRouter);
app.use(shutdownGuard(readiness));
app.use(cors());
app.use(express.json());
app.use(createGatewaySecretMiddleware(config.gatewaySecret));
app.use(attachPaymentUser);
app.use(paymentRoutes);
app.use((_req, res) => res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } }));
app.use(createErrorHandler(logger));

async function bootstrap() {
  try {
    await connectDb();
    const server = app.listen(config.port, () => logger.info({ port: config.port }, "service started"));
    installShutdown({ server, logger, state: readiness, cleanup: [closeDb] });
  } catch (err) {
    logger.fatal({ err }, "service startup failed");
    process.exitCode = 1;
  }
}
void bootstrap();
