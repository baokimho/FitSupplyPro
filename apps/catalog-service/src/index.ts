import { closeDb } from "./config/db.js";
import express from "express";
import { healthRouter, readiness } from "./health.js";
import { logger } from "./logger.js";
import cors from "cors";
import { config } from "./config/index.js";
import { installShutdown, shutdownGuard, correlationMiddleware, httpLogger, createErrorHandler, createGatewaySecretMiddleware } from "@shared/utils";
import categoryRoutes from "./routes/categories.route.js";
import brandRoutes from "./routes/brands.route.js";
import productRoutes from "./routes/products.route.js";
import { connectDb } from "./config/connect-db.js";



const app = express();

app.use(correlationMiddleware("service"));
app.use(httpLogger(logger));
app.use(healthRouter);
app.use(shutdownGuard(readiness));

app.use(cors());
app.use(express.json());
app.use(createGatewaySecretMiddleware(config.gatewaySecret));
app.use(categoryRoutes);
app.use(brandRoutes);
app.use(productRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

app.use(createErrorHandler(logger));

const PORT = config.port;

async function bootstrap() {
  try {
    await connectDb();

    const server = app.listen(PORT, () => {
      logger.info({ port: PORT }, "service started");
    });
    installShutdown({ server, logger, state: readiness, cleanup: [closeDb] });
  } catch (err) {
    logger.fatal({ err: err }, "service startup failed");
    process.exitCode = 1;
  }
}

void bootstrap();
