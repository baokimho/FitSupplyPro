import { Router } from "express";
import { validateRequest, wrapAsync } from "@shared/utils";
import {
  adjustInventorySchema,
  batchInventorySchema,
  consumeInventorySchema,
  createInventorySchema,
  inventoryProductParamsSchema,
  releaseInventorySchema,
  reserveInventorySchema,
  updateInventorySchema,
} from "../validations/inventory.schema.js";
import {
  adjustInventoryStock,
  consumeInventoryReservation,
  createInventory,
  getInventoriesByProductIds,
  getInventoryByProductId,
  releaseInventoryStock,
  reserveInventoryStock,
  updateInventoryByProductId,
} from "../controllers/inventory.controller.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    service: "inventory-service",
    status: "ok",
  });
});

router.post("/", validateRequest("body", createInventorySchema), wrapAsync(createInventory));
router.post(
  "/products/batch",
  validateRequest("body", batchInventorySchema),
  wrapAsync(getInventoriesByProductIds),
);
router.get(
  "/products/:productId",
  validateRequest("params", inventoryProductParamsSchema),
  wrapAsync(getInventoryByProductId),
);
router.patch(
  "/products/:productId",
  validateRequest("params", inventoryProductParamsSchema),
  validateRequest("body", updateInventorySchema),
  wrapAsync(updateInventoryByProductId),
);
router.post(
  "/products/:productId/adjust",
  validateRequest("params", inventoryProductParamsSchema),
  validateRequest("body", adjustInventorySchema),
  wrapAsync(adjustInventoryStock),
);
router.post(
  "/products/:productId/reserve",
  validateRequest("params", inventoryProductParamsSchema),
  validateRequest("body", reserveInventorySchema),
  wrapAsync(reserveInventoryStock),
);
router.post(
  "/products/:productId/consume",
  validateRequest("params", inventoryProductParamsSchema),
  validateRequest("body", consumeInventorySchema),
  wrapAsync(consumeInventoryReservation),
);
router.post(
  "/products/:productId/release",
  validateRequest("params", inventoryProductParamsSchema),
  validateRequest("body", releaseInventorySchema),
  wrapAsync(releaseInventoryStock),
);

export default router;
