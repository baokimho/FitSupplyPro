import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { proxyMiddleware } from "./proxy/authProxy.proxy";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", proxyMiddleware);

app.get("/health", (req, res) => {
  res.json({
    service: "api-gateway",
    status: "ok",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Api Gateway running on port ${PORT}`);
});