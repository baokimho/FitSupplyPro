import express from "express";
import { logger } from "./logger.js";
import cors from "cors";
import { config } from "./config/index.js";
import { correlationMiddleware, httpLogger, createErrorHandler, createGatewaySecretMiddleware } from "@shared/utils";
import inventoryRoutes from "./routes/inventory.route.js";
import { connectDb } from "./config/connect-db.js";



const app = express();

app.use(correlationMiddleware("service"));
app.use(httpLogger(logger));

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
