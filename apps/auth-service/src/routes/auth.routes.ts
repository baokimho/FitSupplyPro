import { Router } from "express";
import {
  login,
  logout,
  refreshToken,
  register,
  getPublic,
} from "../controllers/auth.controller.js";
import { wrapAsync } from "@shared/utils";

const router = Router();

router.get("/jwks", wrapAsync(getPublic));
router.post("/register", wrapAsync(register));
router.post("/login", wrapAsync(login));
router.post("/refresh-token", wrapAsync(refreshToken));
router.post("/logout", wrapAsync(logout));

export default router;