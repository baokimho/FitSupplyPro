import { readiness } from "./health.js";
import { logger } from "./logger.js";
import { config } from "./config/index.js";
import { installShutdown } from "@shared/utils";
import { createApp } from "./app.js";

const app = createApp();

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, "service started");
});
server.requestTimeout = config.proxyTimeoutMs;
server.headersTimeout = Math.min(10_000, config.proxyTimeoutMs);

installShutdown({ server, logger, state: readiness });
