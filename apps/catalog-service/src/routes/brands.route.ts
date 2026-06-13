import { Router } from "express";
import { validateRequest, wrapAsync } from "@shared/utils";
import {
  brandParamsSchema,
  createBrandSchema,
  updateBrandSchema,
} from "../validations/brand.schema.js";
import {
  createBrand,
  deleteBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
} from "../controllers/brands.controller.js";

const router = Router();

router.post("/brands", validateRequest("body", createBrandSchema), wrapAsync(createBrand));
router.get("/brands", wrapAsync(getAllBrands));
router.get("/brands/:id", validateRequest("params", brandParamsSchema), wrapAsync(getBrandById));
router.patch("/brands/:id", validateRequest("body", updateBrandSchema), validateRequest("params", brandParamsSchema), wrapAsync(updateBrand));
router.delete("/brands/:id", validateRequest("params", brandParamsSchema), wrapAsync(deleteBrand));

export default router;
