import { Router } from "express";

import { validateRequest, wrapAsync } from "@shared/utils";
import {
  createCategorySchema,
  updateCategorySchema,
} from "./validations/category.schema.js";
import {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
} from "./controllers/catalog.controller.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({
    service: "catalog-service",
    status: "ok",
  });
});

router.post(
  "/categories",
  validateRequest(createCategorySchema),
  wrapAsync(createCategory),
);
router.get("/categories", wrapAsync(getAllCategories));
router.get("/categories/:id", wrapAsync(getCategoryById));
router.put(
  "/categories/:id",
  validateRequest(updateCategorySchema),
  wrapAsync(updateCategory),
);
router.delete("/categories/:id", wrapAsync(deleteCategory));

export default router;
