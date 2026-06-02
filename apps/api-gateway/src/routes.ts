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

router.use("/auth/login", authLimiter, authProxy);
router.use("/auth/register", authLimiter, authProxy);
router.use("/auth/forgot-password", authLimiter, authProxy);
router.use("/auth/refresh", refreshTokenLimiter, authProxy);
router.use("/auth/me", authMiddleware, authProxy);
router.use("/auth", authProxy);
router.use("/catalog", authMiddleware, catalogLimiter, catalogProxy);
router.use("/order", authMiddleware, orderLimiter, orderProxy);

router.use(errorHandler);

export default router;