import { createHealthRouter } from "@shared/utils";
import { logger } from "./logger.js";
import prisma from "./config/db.js";

export const readiness = { stopping: false };
export const healthRouter = createHealthRouter({
  service: "order-service",
  logger,
  isReady: () => !readiness.stopping,
  checkReady: () => prisma.$queryRaw`SELECT 1`,
});
