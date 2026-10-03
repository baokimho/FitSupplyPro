import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { errorHandler, createGatewaySecretMiddleware } from "@shared/utils";
import { connectDb } from "./config/connect-db.js";
import { attachOrderUser } from "./middleware/user-context.middleware.js";
import orderRoutes from "./routes/order.route.js";



const app = express();

app.use(cors());
app.use(express.json());
app.use(createGatewaySecretMiddleware(config.gatewaySecret));
app.get("/health", (_req, res) => {
  res.json({
    service: "order-service",
    status: "ok",
  });
});
app.use((req, _res, next) => {
  console.info("[ORDER SERVICE]", {
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    hasUserIdHeader: Boolean(req.get("x-user-id")),
  });
  next();
});
app.use(attachOrderUser);
app.use(orderRoutes);

app.use((_req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

app.use(errorHandler);

const PORT = config.port;

async function bootstrap() {
  try {
    await connectDb();

    app.listen(PORT, () => {
      console.log(`Order service running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start order service:", err);
    process.exitCode = 1;
  }
}

void bootstrap();
