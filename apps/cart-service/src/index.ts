import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createErrorHandler, requireGatewaySecret, createLogger, parseNodeEnv, httpLogger, correlationMiddleware, installShutdown, shutdownGuard, createHealthRouter } from "@shared/utils";
import prisma, { closeDb } from "./config/db.js";
import { connectDb } from "./config/connect-db.js";
import { attachCartUser } from "./middleware/user-context.middleware.js";
import cartRoutes from "./routes/cart.route.js";

dotenv.config();

if (!process.env.GATEWAY_SECRET) {
  throw new Error("GATEWAY_SECRET is not set");
}

const app = express();
const logger = createLogger({ service: "cart-service", environment: parseNodeEnv("NODE_ENV", process.env.NODE_ENV, "development") });
const readiness = { stopping: false };
app.use(correlationMiddleware("service"), httpLogger(logger));
app.use(createHealthRouter({ service: "cart-service", logger, isReady: () => !readiness.stopping, checkReady: () => prisma.$queryRaw`SELECT 1` }));
app.use(shutdownGuard(readiness));

app.use(cors());
app.use(express.json());
app.use(requireGatewaySecret);
app.use(attachCartUser);
app.use(cartRoutes);

app.use((_req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

app.use(createErrorHandler(logger));

const PORT = process.env.PORT || 3005;

async function bootstrap() {
  try {
    await connectDb();

    const server = app.listen(PORT, () => {
      console.log(`Cart service running on port ${PORT}`);
    });
    installShutdown({ server, logger, state: readiness, cleanup: [closeDb] });
  } catch (err) {
    await closeDb();
    logger.fatal({ err }, "service startup failed");
    process.exitCode = 1;
  }
}

void bootstrap();
