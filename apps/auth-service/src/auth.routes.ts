import { Router } from "express";
import {
  login,
  logout,
  getMe,
  refreshToken,
  register,
  getPublic,
} from "./controllers/auth.controller.js";
import { validateRequest, wrapAsync } from "@shared/utils";
import { loginSchema, registerSchema } from "./validations/auth.schema.js"

const router = Router();

router.get("/jwks", wrapAsync(getPublic));
router.get("/me", wrapAsync(getMe));
router.post("/register", validateRequest(registerSchema), wrapAsync(register));
router.post("/login", validateRequest(loginSchema), wrapAsync(login));
router.post("/refresh-token", wrapAsync(refreshToken));
router.post("/logout", wrapAsync(logout));

export default router;
