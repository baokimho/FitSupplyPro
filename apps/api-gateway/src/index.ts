import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { requestLogger } from "./middleware/requestLogger.middleware.js";
import router from "./routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.set("trust proxy", 1);
app.use(requestLogger);
app.use(router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Api Gateway running on port ${PORT}`);
});