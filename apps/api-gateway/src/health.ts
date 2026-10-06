import { createHealthRouter } from "@shared/utils";
import { logger } from "./logger.js";

export const readiness = { stopping: false };
export const healthRouter = createHealthRouter({
  service: "api-gateway",
  logger,
  isReady: () => !readiness.stopping,
});
