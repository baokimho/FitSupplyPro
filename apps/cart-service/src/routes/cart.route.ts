import { Router } from "express";
import { validateRequest, wrapAsync } from "@shared/utils";
import {
  addCartItem,
  clearCart,
  deleteCartItem,
  getCart,
  updateCartItem,
} from "../controllers/cart.controller.js";
import {
  addCartItemSchema,
  cartItemParamsSchema,
  updateCartItemSchema,
} from "../validations/cart.schema.js";

const router = Router();

router.get("/", wrapAsync(getCart));
router.post("/items", validateRequest("body", addCartItemSchema), wrapAsync(addCartItem));
router.patch(
  "/items/:id",
  validateRequest("params", cartItemParamsSchema),
  validateRequest("body", updateCartItemSchema),
  wrapAsync(updateCartItem),
);
router.delete("/items/:id", validateRequest("params", cartItemParamsSchema), wrapAsync(deleteCartItem));
router.delete("/", wrapAsync(clearCart));

export default router;
