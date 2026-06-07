import { Router } from "express";
import {
  login,
  logout,
  getMe,
  refreshToken,
  register,
  getPublic,
} from "./controllers/auth.controller.js";
import { wrapAsync } from "@shared/utils";
import { validateRequest } from "./middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "@shared/utils"

const router = Router();

router.get("/jwks", wrapAsync(getPublic));
router.get("/me", wrapAsync(getMe));
router.post("/register", validateRequest(registerSchema), wrapAsync(register));
router.post("/login", validateRequest(loginSchema), wrapAsync(login));
router.post("/refresh-token", wrapAsync(refreshToken));
router.post("/logout", wrapAsync(logout));

export default router;