import { createHealthRouter, registerCheckoutMetrics } from "@shared/utils";
import { logger } from "./logger.js";
import prisma from "./config/db.js";
registerCheckoutMetrics(prisma, "order-service");

export const readiness = { stopping: false, brokerReady: () => true };
export const healthRouter = createHealthRouter({
  service: "order-service",
  logger,
  isReady: () => !readiness.stopping && readiness.brokerReady(),
  checkReady: () => prisma.$queryRaw`SELECT 1`,
});
