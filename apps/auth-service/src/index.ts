import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./config/db.js";
import { connectDb } from "./config/connect-db.js";
import { startRefreshTokenCleanupJob } from "./config/refresh-token-cleanup.js";
import { requireGatewaySecret } from "@shared/utils";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "@shared/utils";

dotenv.config();

if (!process.env.GATEWAY_SECRET) {
  throw new Error("GATEWAY_SECRET is not set");
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(requireGatewaySecret);
app.use(authRoutes);

app.get("/health", (req, res) => {
  res.json({
    service: "auth-service",
    status: "ok",
  });
});

const PORT = process.env.PORT || 3001;
let refreshTokenCleanupJob: NodeJS.Timeout | null = null;

async function bootstrap() {
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

app.use(errorHandler);

bootstrap().catch((error) => {
  console.error("Failed to start auth service:", error);
  process.exit(1);
});