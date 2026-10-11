import { createHealthRouter } from "@shared/utils";
import { logger } from "./logger.js";
import prisma from "./config/db.js";

export const readiness = { stopping: false, brokerReady: () => true };
export const healthRouter = createHealthRouter({
  service: "inventory-service",
  logger,
  isReady: () => !readiness.stopping && readiness.brokerReady(),
  checkReady: () => prisma.$queryRaw`SELECT 1`,
});
