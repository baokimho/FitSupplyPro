import { closeDb } from "./config/db.js";
import { startCheckoutMessaging } from "@shared/utils";
import { handleInventoryCheckout, inventoryCompensationFailure } from "./services/checkout.service.js";
import express from "express";
import { healthRouter, readiness } from "./health.js";
import { logger } from "./logger.js";
import cors from "cors";
import { config } from "./config/index.js";
import { installShutdown, shutdownGuard, correlationMiddleware, httpLogger, createErrorHandler, createGatewaySecretMiddleware } from "@shared/utils";
import inventoryRoutes from "./routes/inventory.route.js";
import { connectDb } from "./config/connect-db.js";



const app = express();

app.use(correlationMiddleware("service"));
app.use(httpLogger(logger));
app.use(healthRouter);
app.use(shutdownGuard(readiness));

app.use(cors());
app.use(express.json());
app.use(createGatewaySecretMiddleware(config.gatewaySecret));
app.use(inventoryRoutes);

app.use((_req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

app.use(createErrorHandler(logger));

const PORT = config.port;

async function bootstrap() {
  let messaging: Awaited<ReturnType<typeof startCheckoutMessaging>> | undefined;
  try {
    await connectDb();
    if (config.checkout.broker) {
      readiness.brokerReady = () => false;
      messaging = await startCheckoutMessaging(config.checkout.broker, logger, "inventory.order-created", ["order.created", "order.cancelled"], handleInventoryCheckout, inventoryCompensationFailure);
      readiness.brokerReady = messaging.isReady;
    }

    const server = app.listen(PORT, () => {
      logger.info({ port: PORT }, "service started");
    });
    installShutdown({ server, logger, state: readiness, cleanup: [...(messaging ? [messaging.close] : []), closeDb] });
  } catch (err) {
    if (messaging) await messaging.close();
    await closeDb();
    logger.fatal({ err: err }, "service startup failed");
    process.exitCode = 1;
  }
}

void bootstrap();
