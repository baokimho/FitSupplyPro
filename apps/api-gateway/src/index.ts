import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authProxy } from "./proxy/authProxy.proxy.js";
import { catalogProxy } from "./proxy/catalogProxy.proxy.js";
import { orderProxy } from "./proxy/orderProxy.proxy.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth", authProxy);
app.use("/catalog", catalogProxy);
app.use("/order", orderProxy);

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