import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import prisma from "../config/db.js";
import {
  comparePassword,
  createAuthToken,
  hashPassword,
  rotateRefreshToken,
  revokeRefreshToken,
  saveRefreshToken,
  sanitizeUser,
  getJWKS,
  getPublicKey,
} from "../services/auth.service.js";
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
  return res.status(StatusCodes.OK).json(await getJWKS());
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

  return res.status(StatusCodes.OK).json({
    user: sanitizeUser(user),
  });
}

export async function register(
  req: Request<{}, {}, RegisterInput>,
  res: Response,
) {
  const { email, password, name } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ConflictError("Email already exists");
  }

  const passwordHash = await hashPassword(password);
  const { user, tokens } = await prisma.$transaction(async (tx) => {
    let user;
    try {
      user = await tx.user.create({ data: { email: normalizedEmail, name: name.trim(), passwordHash, role: Role.CUSTOMER } });
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "P2002") throw new ConflictError("Email already exists");
      throw error;
    }
    const tokens = await getAuthTokens(user);
    await saveRefreshToken(tx, user.id, tokens.refreshToken);
    return { user, tokens };
  });

  return res.status(StatusCodes.CREATED).json({
    message: "User registered successfully",
    user: sanitizeUser(user),
    ...tokens,
  });
}

export async function login(
  req: Request<{}, {}, LoginInput>,
  res: Response,
) {
  const { email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  const matches = await comparePassword(password, user?.passwordHash);
  if (!user || !matches) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (!user.passwordHash.startsWith("scrypt:")) {
    await prisma.user.updateMany({ where: { id: user.id, passwordHash: user.passwordHash }, data: { passwordHash: await hashPassword(password) } });
  }
  const tokens = await getAuthTokens(user);
  await saveRefreshToken(prisma, user.id, tokens.refreshToken);

  return res.status(StatusCodes.OK).json({
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

  const payload = await verifyAuthToken(token, getPublicKey, "refresh");
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  const tokens = await getAuthTokens(user);
  await rotateRefreshToken(prisma, token, user.id, tokens.refreshToken);

  return res.status(StatusCodes.OK).json({
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
    await revokeRefreshToken(prisma, token);
  }

  return res.status(StatusCodes.OK).json({
    message: "Logout successful",
  });
}
