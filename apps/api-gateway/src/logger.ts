import { createLogger } from "@shared/utils";
import { config } from "./config/index.js";

export const logger = createLogger({
  service: "api-gateway",
  environment: config.nodeEnv,
  level: config.logLevel,
});
