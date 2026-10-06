import express from "express";
import { logger } from "./logger.js";
import cors from "cors";
import { config } from "./config/index.js";
import router from "./routes.js";
import helmet from "helmet";
import { httpLogger, createErrorHandler } from "@shared/utils";



const app = express();

app.use(httpLogger(logger));

app.use(helmet());
app.use(cors());
app.set("trust proxy", 1);
app.use(router);
app.use(createErrorHandler(logger));

const PORT = config.port;

app.listen(PORT, () => {
  logger.info({ port: PORT }, "service started");
});
