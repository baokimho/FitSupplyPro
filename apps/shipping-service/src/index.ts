import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler, requireGatewaySecret, createLogger, parseNodeEnv, httpLogger, correlationMiddleware, installShutdown, shutdownGuard } from "@shared/utils";
import { closeDb } from "./config/db.js";
import { connectDb } from "./config/connect-db.js";
import { attachShippingUser } from "./middleware/user-context.middleware.js";
import shippingRoutes from "./routes/shipping.route.js";

dotenv.config();

if (!process.env.GATEWAY_SECRET) {
  throw new Error("GATEWAY_SECRET is not set");
}

const app = express();
const logger = createLogger({ service: "shipping-service", environment: parseNodeEnv("NODE_ENV", process.env.NODE_ENV, "development") });
const readiness = { stopping: false };
app.use(correlationMiddleware("service"), httpLogger(logger), shutdownGuard(readiness));

app.use(cors());
app.use(express.json());
app.use(requireGatewaySecret);
app.get("/health", (_req, res) => {
  res.json({
    service: "shipping-service",
    status: "ok",
  });
});
app.use(attachShippingUser);
app.use(shippingRoutes);

app.use((_req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3007;

async function bootstrap() {
  try {
    await connectDb();

    const server = app.listen(PORT, () => {
      console.log(`Shipping service running on port ${PORT}`);
    });
    installShutdown({ server, logger, state: readiness, cleanup: [closeDb] });
  } catch (err) {
    console.error("Failed to start shipping service:", err);
    process.exitCode = 1;
  }
}

void bootstrap();
