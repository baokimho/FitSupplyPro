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
import { blockInternalRoute, requireRole } from "./middleware/accessControl.middleware.js";

const router = Router();
const requireAdmin = requireRole("ADMIN");

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
router.post("/catalog/products", authMiddleware, requireAdmin);
router.put("/catalog/products/:id", authMiddleware, requireAdmin);
router.delete("/catalog/products/:id", authMiddleware, requireAdmin);
router.patch("/catalog/products/:id/publish", authMiddleware, requireAdmin);
router.patch("/catalog/products/:id/unpublish", authMiddleware, requireAdmin);
router.post("/catalog/categories", authMiddleware, requireAdmin);
router.put("/catalog/categories/:id", authMiddleware, requireAdmin);
router.delete("/catalog/categories/:id", authMiddleware, requireAdmin);
router.post("/catalog/brands", authMiddleware, requireAdmin);
router.patch("/catalog/brands/:id", authMiddleware, requireAdmin);
router.delete("/catalog/brands/:id", authMiddleware, requireAdmin);
router.post("/inventory", authMiddleware, requireAdmin);
router.patch("/inventory/products/:productId", authMiddleware, requireAdmin);
router.post("/inventory/products/:productId/adjust", authMiddleware, requireAdmin);
router.post("/inventory/products/:productId/reserve", authMiddleware, requireAdmin);
router.post("/inventory/products/:productId/consume", authMiddleware, requireAdmin);
router.post("/inventory/products/:productId/release", authMiddleware, requireAdmin);
router.patch("/payment/payments/:id/confirm", authMiddleware, requireAdmin);
router.patch("/payment/payments/:id/fail", authMiddleware, requireAdmin);
router.patch("/payment/payments/:id/refund", authMiddleware, requireAdmin);
router.post("/shipping/shipments", authMiddleware, requireAdmin);
router.patch("/shipping/shipments/:id/status", authMiddleware, requireAdmin);
router.use("/catalog", authMiddleware, blockInternalRoute, catalogLimiter, catalogProxy);
router.use("/inventory", authMiddleware, blockInternalRoute, inventoryLimiter, inventoryProxy);
router.use("/cart", authMiddleware, blockInternalRoute, cartLimiter, cartProxy);
router.use("/order", authMiddleware, blockInternalRoute, orderLimiter, orderProxy);
router.use("/payment", authMiddleware, blockInternalRoute, paymentLimiter, paymentProxy);
router.use("/shipping", authMiddleware, blockInternalRoute, shippingLimiter, shippingProxy);
router.use("/notification", authMiddleware, blockInternalRoute, notificationLimiter, notificationProxy);

router.use(errorHandler);

export default router;
