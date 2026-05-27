import type { Request, Response } from "express";
import prisma from "../config/db.js";
import {
  comparePassword,
  createAuthToken,
  findActiveRefreshToken,
  hashPassword,
  rotateRefreshToken,
  revokeRefreshToken,
  saveRefreshToken,
  sanitizeUser,
  verifyAuthToken,
  getJWKS,
} from "../utils/auth.js";
import { Role } from "@prisma/client";
import { BadRequestError, ConflictError, UnauthorizedError } from "../errors/httpErrors.js";

function isString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function getAuthTokens(user: Parameters<typeof createAuthToken>[0]) {
  return {
    accessToken: await createAuthToken(user, "access"),
    refreshToken: await createAuthToken(user, "refresh"),
  };
}

export async function getPublic(req: Request, res: Response) {
  return res.status(200).json(await getJWKS());
}

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body as {
    email?: unknown;
    password?: unknown;
    name?: unknown;
  };

  if (!isString(email) || !isString(password) || !isString(name)) {
    throw new BadRequestError("email, password and name are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ConflictError("Email already exists");
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name.trim(),
      passwordHash: hashPassword(password),
      role: Role.CUSTOMER,
    },
  });

  const tokens = await getAuthTokens(user);
  await saveRefreshToken(prisma, user.id, tokens.refreshToken);

  return res.status(201).json({
    message: "User registered successfully",
    user: sanitizeUser(user),
    ...tokens,
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as {
    email?: unknown;
    password?: unknown;
  };

  if (!isString(email) || !isString(password)) {
    throw new BadRequestError("email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user || !comparePassword(password, user.passwordHash)) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const tokens = await getAuthTokens(user);
  await saveRefreshToken(prisma, user.id, tokens.refreshToken);

  return res.status(200).json({
    message: "Login successful",
    user: sanitizeUser(user),
    ...tokens,
  });
}

export async function refreshToken(req: Request, res: Response) {
  const { refreshToken } = req.body as {
    refreshToken?: unknown;
  };

  if (!isString(refreshToken)) {
    throw new BadRequestError("refreshToken is required");
  }

  const payload = await verifyAuthToken(refreshToken, "refresh");
  const activeToken = await findActiveRefreshToken(prisma, refreshToken);

  if (!activeToken) {
    throw new UnauthorizedError("Invalid or revoked refresh token");
  }

  if (activeToken.userId !== payload.sub) {
    throw new UnauthorizedError("Invalid or revoked refresh token");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  const tokens = await getAuthTokens(user);
  await rotateRefreshToken(prisma, refreshToken, user.id, tokens.refreshToken);

  return res.status(200).json({
    message: "Token refreshed successfully",
    ...tokens,
  });
}


export async function logout(req: Request, res: Response) {

  const { refreshToken } = req.body as {
    refreshToken?: unknown;
  };

  if (typeof refreshToken === "string" && refreshToken.trim().length > 0) {
    try {
      await revokeRefreshToken(prisma, refreshToken);
    } catch {
      // Keep logout idempotent even if the token was already missing.
    }
  }

  return res.status(200).json({
    message: "Logout successful",
  });
}