import { Router } from "express";
import { authMiddleware } from "./middleware/auth.middleware.js";
import {
  authLimiter,
  cartLimiter,
  catalogLimiter,
  inventoryLimiter,
  notificationLimiter,
  orderLimiter,
  paymentLimiter,
  refreshTokenLimiter,
  shippingLimiter,
} from "./middleware/rateLimit.middleware.js";
import { cartProxy } from "./proxy/cartProxy.proxy.js";
import { authProxy } from "./proxy/authProxy.proxy.js";
import { catalogProxy } from "./proxy/catalogProxy.proxy.js";
import { inventoryProxy } from "./proxy/inventoryProxy.proxy.js";
import { notificationProxy } from "./proxy/notificationProxy.proxy.js";
import { orderProxy } from "./proxy/orderProxy.proxy.js";
import { paymentProxy } from "./proxy/paymentProxy.proxy.js";
import { shippingProxy } from "./proxy/shippingProxy.proxy.js";
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
router.use("/inventory", authMiddleware, inventoryLimiter, inventoryProxy);
router.use("/cart", authMiddleware, cartLimiter, cartProxy);
router.use("/order", authMiddleware, orderLimiter, orderProxy);
router.use("/payment", authMiddleware, paymentLimiter, paymentProxy);
router.use("/shipping", authMiddleware, shippingLimiter, shippingProxy);
router.use("/notification", authMiddleware, notificationLimiter, notificationProxy);

router.use(errorHandler);

export default router;
