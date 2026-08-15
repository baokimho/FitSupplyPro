import { Router } from "express";
import { validateRequest, wrapAsync } from "@shared/utils";
import {
  cancelOrder,
  checkoutOrder,
  confirmOrder,
  createOrder,
  getMyOrders,
  getOrderById,
  getInternalOrderShippingSnapshot,
} from "../controllers/order.controller.js";
import { checkoutSchema, createOrderSchema, orderParamsSchema } from "../validations/order.schema.js";

const router = Router();

router.get("/internal/orders/:id/shipping-snapshot", validateRequest("params", orderParamsSchema), wrapAsync(getInternalOrderShippingSnapshot));
router.post("/orders", validateRequest("body", createOrderSchema), wrapAsync(createOrder));
router.post("/orders/checkout", validateRequest("body", checkoutSchema), wrapAsync(checkoutOrder));
router.get("/orders/me", wrapAsync(getMyOrders));
router.get("/orders/:id", validateRequest("params", orderParamsSchema), wrapAsync(getOrderById));
router.patch(
  "/orders/:id/cancel",
  validateRequest("params", orderParamsSchema),
  wrapAsync(cancelOrder),
);
router.patch(
  "/orders/:id/confirm",
  validateRequest("params", orderParamsSchema),
  wrapAsync(confirmOrder),
);

export default router;
