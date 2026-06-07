import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes.js";
import helmet from "helmet";
import morgan from "morgan";


dotenv.config();

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.set("trust proxy", 1);
app.use(router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Api Gateway running on port ${PORT}`);
});