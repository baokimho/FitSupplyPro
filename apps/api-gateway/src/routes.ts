import { Router } from "express";
import { authMiddleware } from "./middleware/auth.middleware.js";
import {
  authLimiter,
  catalogLimiter,
  orderLimiter,
  refreshTokenLimiter,
} from "./middleware/rateLimit.middleware.js";
import { authProxy } from "./proxy/authProxy.proxy.js";
import { catalogProxy } from "./proxy/catalogProxy.proxy.js";
import { orderProxy } from "./proxy/orderProxy.proxy.js";
import { errorHandler } from "@shared/utils";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    service: "api-gateway",
    status: "ok",
  });
});

router.use("/auth/login", authLimiter);
router.use("/auth/register", authLimiter);
router.use("/auth/forgot-password", authLimiter);
router.use("/auth/refresh-token", refreshTokenLimiter);
router.use("/auth/refresh", refreshTokenLimiter);
router.use("/auth/me", authMiddleware);
router.use("/auth", authProxy);
router.use("/catalog", authMiddleware, catalogLimiter, catalogProxy);
router.use("/order", authMiddleware, orderLimiter, orderProxy);

router.use(errorHandler);

export default router;