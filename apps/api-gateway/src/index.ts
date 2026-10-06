import express from "express";
import { healthRouter, readiness } from "./health.js";
import { logger } from "./logger.js";
import cors from "cors";
import { config } from "./config/index.js";
import router from "./routes.js";
import helmet from "helmet";
import { installShutdown, shutdownGuard, correlationMiddleware, httpLogger, createErrorHandler } from "@shared/utils";



const app = express();

app.use(correlationMiddleware("gateway"));
app.use(httpLogger(logger));
app.use(healthRouter);
app.use(shutdownGuard(readiness));

app.use(helmet());
app.use(cors({ exposedHeaders: ["x-request-id"] }));
app.set("trust proxy", 1);
app.use(router);
app.use(createErrorHandler(logger));

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, "service started");
});

installShutdown({ server, logger, state: readiness });
