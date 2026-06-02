import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { requireGatewaySecret } from "@shared/utils";

dotenv.config();

if (!process.env.GATEWAY_SECRET) {
  throw new Error("GATEWAY_SECRET is not set");
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(requireGatewaySecret);

app.get("/health", (req, res) => {
  res.json({
    service: "catalog-service",
    status: "ok",
  });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`Catalog service running on port ${PORT}`);
});