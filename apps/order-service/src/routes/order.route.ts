import { Router } from "express";
import { validateRequest, wrapAsync } from "@shared/utils";
import {
  cancelOrder,
  checkoutOrder,
  confirmOrder,
  confirmInternalOrder,
  processOrder,
  shipOrder,
  deliverOrder,
  createOrder,
  getMyOrders,
  getOrderById,
  getInternalOrderShippingSnapshot,
  getInternalOrderPaymentSnapshot,
} from "../controllers/order.controller.js";
import { checkoutSchema, createOrderSchema, orderParamsSchema } from "../validations/order.schema.js";

const router = Router();

router.get("/internal/orders/:id/payment-snapshot", validateRequest("params", orderParamsSchema), wrapAsync(getInternalOrderPaymentSnapshot));

router.get("/internal/orders/:id/shipping-snapshot", validateRequest("params", orderParamsSchema), wrapAsync(getInternalOrderShippingSnapshot));
router.patch("/internal/orders/:id/confirm", validateRequest("params", orderParamsSchema), wrapAsync(confirmInternalOrder));
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
router.patch("/orders/:id/process", validateRequest("params", orderParamsSchema), wrapAsync(processOrder));
router.patch("/orders/:id/ship", validateRequest("params", orderParamsSchema), wrapAsync(shipOrder));
router.patch("/orders/:id/deliver", validateRequest("params", orderParamsSchema), wrapAsync(deliverOrder));

export default router;
