import { Router } from "express";
import { validateRequest, wrapAsync } from "@shared/utils";
import {
  confirmPayment,
  createPayment,
  failPayment,
  getMyPayments,
  getPaymentById,
  refundPayment,
} from "../controllers/payment.controller.js";
import { createPaymentSchema, paymentParamsSchema } from "../validations/payment.schema.js";

const router = Router();

router.post("/payments", validateRequest("body", createPaymentSchema), wrapAsync(createPayment));
router.get("/payments/me", wrapAsync(getMyPayments));
router.get("/payments/:id", validateRequest("params", paymentParamsSchema), wrapAsync(getPaymentById));
router.patch(
  "/payments/:id/confirm",
  validateRequest("params", paymentParamsSchema),
  wrapAsync(confirmPayment),
);
router.patch(
  "/payments/:id/fail",
  validateRequest("params", paymentParamsSchema),
  wrapAsync(failPayment),
);
router.patch(
  "/payments/:id/refund",
  validateRequest("params", paymentParamsSchema),
  wrapAsync(refundPayment),
);

export default router;
