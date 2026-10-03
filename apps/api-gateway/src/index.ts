import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import router from "./routes.js";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "@shared/utils";



const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.set("trust proxy", 1);
app.use(router);
app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Api Gateway running on port ${PORT}`);
});
