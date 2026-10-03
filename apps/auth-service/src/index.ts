import { initializeAuthKeys } from "./services/auth.service.js";
import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import prisma from "./config/db.js";
import { connectDb } from "./config/connect-db.js";
import { startRefreshTokenCleanupJob } from "./config/refresh-token-cleanup.js";
import { createGatewaySecretMiddleware } from "@shared/utils";
import authRoutes from "./auth.routes.js";
import { errorHandler } from "@shared/utils";



const app = express();

app.use(cors());
app.use(express.json());
app.use(createGatewaySecretMiddleware(config.gatewaySecret));
app.use((req, _res, next) => {
  console.log("[AUTH SERVICE]", req.method, req.url);
  next();
});
app.use(authRoutes);

app.get("/health", (req, res) => {
  res.json({
    service: "auth-service",
    status: "ok",
  });
});

const PORT = config.port;
let refreshTokenCleanupJob: NodeJS.Timeout | null = null;

async function bootstrap() {
  await initializeAuthKeys();
  await connectDb();
  refreshTokenCleanupJob = startRefreshTokenCleanupJob();

  const server = app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("SIGTERM received, shutting down gracefully...");
    server.close(async () => {
      if (refreshTokenCleanupJob) {
        clearInterval(refreshTokenCleanupJob);
      }

      await prisma.$disconnect();
      process.exit(0);
    });
  });

  process.on("SIGINT", async () => {
    console.log("SIGINT received, shutting down gracefully...");
    server.close(async () => {
      if (refreshTokenCleanupJob) {
        clearInterval(refreshTokenCleanupJob);
      }

      await prisma.$disconnect();
      process.exit(0);
    });
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
});

app.use(errorHandler);

bootstrap().catch((error) => {
  console.error("Failed to start auth service:", error);
  process.exit(1);
});
