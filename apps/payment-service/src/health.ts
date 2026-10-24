import { createHealthRouter, registerCheckoutMetrics } from "@shared/utils";
import { logger } from "./logger.js";
import prisma from "./config/db.js";
registerCheckoutMetrics(prisma, "payment-service");

export const readiness = { stopping: false, brokerReady: () => true };
export const healthRouter = createHealthRouter({
  service: "payment-service", logger, isReady: () => !readiness.stopping && readiness.brokerReady(),
  checkReady: () => prisma.$queryRaw`SELECT 1`,
});
