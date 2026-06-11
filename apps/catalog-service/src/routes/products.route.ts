import { Router } from "express";

import { validateRequest, wrapAsync } from "@shared/utils";
import {
  createProductSchema,
  updateProductSchema,
  getProductQuerySchema
} from "../validations/product.schema.js";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "../controllers/products.controller.js";

const router = Router();

router.post(
  "/products",
  validateRequest(createProductSchema),
  wrapAsync(createProduct),
);
router.get("/products", validateRequest(getProductQuerySchema), wrapAsync(getAllProducts));
router.get("/products/:id", wrapAsync(getProductById));
router.put(
  "/products/:id",
  validateRequest(updateProductSchema),
  wrapAsync(updateProduct),
);
router.delete("/products/:id", wrapAsync(deleteProduct));

export default router;
