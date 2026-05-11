import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./config/db";
import { connectDb } from "./config/connect-db";
import { startRefreshTokenCleanupJob } from "./config/refresh-token-cleanup";
import authRoutes from "./routes/auth.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
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

bootstrap().catch((error) => {
  console.error("Failed to start auth service:", error);
  process.exit(1);
});