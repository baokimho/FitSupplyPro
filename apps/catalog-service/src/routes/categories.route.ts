import { Router } from "express";

import { validateRequest, wrapAsync } from "@shared/utils";
import {
  createCategorySchema,
  categoryParamsSchema,
  updateCategorySchema,
} from "../validations/category.schema.js";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "../controllers/catalog.controller.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    service: "catalog-service",
    status: "ok",
  });
});

router.post(
  "/categories",
  validateRequest("body", createCategorySchema),
  wrapAsync(createCategory),
);
router.get("/categories", wrapAsync(getAllCategories));
router.get("/categories/:id", validateRequest("params", categoryParamsSchema), wrapAsync(getCategoryById));
router.put(
  "/categories/:id",
  validateRequest("body", updateCategorySchema),
  validateRequest("params", categoryParamsSchema),
  wrapAsync(updateCategory),
);
router.delete("/categories/:id", validateRequest("params", categoryParamsSchema), wrapAsync(deleteCategory));

export default router;
