import { Router } from "express";
import {
  login,
  logout,
  refreshToken,
  register,
  getPublic
} from "../controllers/auth.controller.js";


const router = Router();

router.get("/jwks", getPublic)
router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

export default router;