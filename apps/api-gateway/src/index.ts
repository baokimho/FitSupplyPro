import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authMiddleware } from "./middleware/auth.middleware.js";
import { authProxy } from "./proxy/authProxy.proxy.js";
import { catalogProxy } from "./proxy/catalogProxy.proxy.js";
import { orderProxy } from "./proxy/orderProxy.proxy.js";
import { errorHandler } from "@shared/utils"

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/auth/me", authMiddleware, authProxy);
app.use("/auth", authProxy);
app.use("/catalog", authMiddleware, catalogProxy);
app.use("/order", authMiddleware, orderProxy);

app.get("/health", (req, res) => {
  res.json({
    service: "api-gateway",
    status: "ok",
  });
});

app.use(errorHandler)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Api Gateway running on port ${PORT}`);
});