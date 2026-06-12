import { Router } from "express";

import { validateRequest, wrapAsync } from "@shared/utils";
import {
  createProductSchema,
  productParamsSchema,
  updateProductSchema,
  getProductQuerySchema
} from "../validations/product.schema.js";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  publishProduct,
  unpublishProduct
} from "../controllers/products.controller.js";

const router = Router();

router.post(
  "/products",
  validateRequest("body", createProductSchema),
  wrapAsync(createProduct),
);
router.get("/products", validateRequest("query", getProductQuerySchema), wrapAsync(getAllProducts));
router.get("/products/:id", validateRequest("params", productParamsSchema), wrapAsync(getProductById));
router.put(
  "/products/:id",
  validateRequest("body", updateProductSchema),
  validateRequest("params", productParamsSchema),
  wrapAsync(updateProduct),
);
router.delete("/products/:id", validateRequest("params", productParamsSchema), wrapAsync(deleteProduct));
router.patch("/products/:id/publish", wrapAsync(publishProduct))
router.patch("/products/:id/unpublish", wrapAsync(unpublishProduct))

export default router;
