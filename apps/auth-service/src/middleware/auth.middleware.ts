import type { NextFunction, Request, Response } from "express";
import prisma from "../config/db";
import { verifyAuthToken } from "../utils/auth";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Missing bearer token",
    });
  }

  const token = authorization.slice(7).trim();

  try {
    const payload = verifyAuthToken(token, "access");

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}