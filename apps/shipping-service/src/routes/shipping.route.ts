import { Router } from "express";
import { validateRequest, wrapAsync } from "@shared/utils";
import {
  createShipment,
  getMyShipments,
  getShipmentById,
  updateShipmentStatus,
} from "../controllers/shipping.controller.js";
import {
  createShipmentSchema,
  shipmentParamsSchema,
  updateShipmentStatusSchema,
} from "../validations/shipping.schema.js";

const router = Router();

router.post("/shipments", validateRequest("body", createShipmentSchema), wrapAsync(createShipment));
router.get("/shipments/me", wrapAsync(getMyShipments));
router.get("/shipments/:id", validateRequest("params", shipmentParamsSchema), wrapAsync(getShipmentById));
router.patch(
  "/shipments/:id/status",
  validateRequest("params", shipmentParamsSchema),
  validateRequest("body", updateShipmentStatusSchema),
  wrapAsync(updateShipmentStatus),
);

export default router;
