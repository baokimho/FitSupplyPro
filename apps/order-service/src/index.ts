import express from "express";
import { logger } from "./logger.js";
import cors from "cors";
import { config } from "./config/index.js";
import { httpLogger, createErrorHandler, createGatewaySecretMiddleware } from "@shared/utils";
import { connectDb } from "./config/connect-db.js";
import { attachOrderUser } from "./middleware/user-context.middleware.js";
import orderRoutes from "./routes/order.route.js";



const app = express();

app.use(httpLogger(logger));

app.use(cors());
app.use(express.json());
app.use(createGatewaySecretMiddleware(config.gatewaySecret));
app.get("/health", (_req, res) => {
  res.json({
    service: "order-service",
    status: "ok",
  });
});
app.use(attachOrderUser);
app.use(orderRoutes);

app.use((_req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

app.use(createErrorHandler(logger));

const PORT = config.port;

async function bootstrap() {
  try {
    await connectDb();

    app.listen(PORT, () => {
      logger.info({ port: PORT }, "service started");
    });
  } catch (err) {
    logger.fatal({ err: err }, "service startup failed");
    process.exitCode = 1;
  }
}

void bootstrap();
