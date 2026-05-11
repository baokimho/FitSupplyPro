import { Router } from "express";
import {
  login,
  logout,
  me,
  refreshToken,
  register,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);

export default router;