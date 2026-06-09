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
  getJWKS,
  getPublicKey,
} from "../utils/auth.js";
import { Role } from "../generated/prisma/index.js";
import { BadRequestError, ConflictError, UnauthorizedError, verifyAuthToken } from "@shared/utils";
import type { RegisterInput, LoginInput } from "../validations/auth.schema.js";
import { getHeaderValue } from "@shared/utils";

function getTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
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

export async function getMe(req: Request, res: Response) {
  const userId = getHeaderValue(req.headers["x-user-id"]);

  if (!userId) {
    throw new UnauthorizedError("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  return res.status(200).json({
    user: sanitizeUser(user),
  });
}

export async function register(req: Request, res: Response) {
  const { email, password, name } = req.body as RegisterInput;

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
  const { email, password } = req.body as LoginInput;

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

  const token = getTrimmedString(refreshToken);
  if (!token) {
    throw new BadRequestError("refreshToken is required");
  }

  const payload = await verifyAuthToken(token, await getPublicKey(), "refresh");
  const activeToken = await findActiveRefreshToken(prisma, token);

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
  await rotateRefreshToken(prisma, token, user.id, tokens.refreshToken);

  return res.status(200).json({
    message: "Token refreshed successfully",
    ...tokens,
  });
}


export async function logout(req: Request, res: Response) {

  const { refreshToken } = req.body as {
    refreshToken?: unknown;
  };

  const token = getTrimmedString(refreshToken);
  if (token) {
    try {
      await revokeRefreshToken(prisma, token);
    } catch {
      // Keep logout idempotent even if the token was already missing.
    }
  }

  return res.status(200).json({
    message: "Logout successful",
  });
}