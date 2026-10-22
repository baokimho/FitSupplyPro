import { initializeAuthKeys } from "./services/auth.service.js";
import { readiness } from "./health.js";
import { logger } from "./logger.js";
import { config } from "./config/index.js";
import { closeDb } from "./config/db.js";
import { connectDb } from "./config/connect-db.js";
import { startRefreshTokenCleanupJob } from "./config/refresh-token-cleanup.js";
import { installShutdown } from "@shared/utils";
import { createApp } from "./app.js";



const app = createApp();

const PORT = config.port;
let refreshTokenCleanupJob: NodeJS.Timeout | null = null;

async function bootstrap() {
  await initializeAuthKeys();
  await connectDb();
  refreshTokenCleanupJob = startRefreshTokenCleanupJob();

  const server = app.listen(PORT, () => {
    logger.info({ port: PORT }, "service started");
  });

  installShutdown({
    server, logger, state: readiness,
    stopWork: () => { if (refreshTokenCleanupJob) clearInterval(refreshTokenCleanupJob); },
    cleanup: [closeDb],
  });
}

bootstrap().catch((error) => {
  logger.fatal({ err: error }, "service startup failed");
  process.exit(1);
});
