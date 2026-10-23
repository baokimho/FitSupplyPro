import { config } from "../config/index.js";
import crypto from "crypto";
import { SignJWT } from "jose";
import { createAuthKeyStore, selectVerificationKey } from "./auth-keys.js";
import { readAuthPolicy } from "@shared/utils";
import {
  UnauthorizedError,
  verifyAuthToken,
  BadRequestError,
  isAuthTokenError,
} from "@shared/utils";
import type { AuthTokenType, AuthUser, JWKSResponse } from "@shared/utils";
import type { PrismaClientOrTx } from "../types/db.type.js";
import type { User } from "../generated/prisma/index.js";

const REFRESH_TOKEN_CLEANUP_AFTER_DAYS = 14;
const getKeys = createAuthKeyStore(config);
const policy = config.authPolicy ?? readAuthPolicy();
export const initializeAuthKeys = async () => { await getKeys(); };
export const getJWKS = async (): Promise<JWKSResponse> => ({ keys: (await getKeys()).publicKeys });
export const getPublicKey = async (header?: { kid?: string; alg?: string }) => selectVerificationKey(await getKeys(), header);
export { hashPassword, comparePassword } from "./password.js";

export async function createAuthToken(user: User, type: AuthTokenType = "access") {
  const { privateKey, activeKid } = await getKeys();
  return await new SignJWT({
    sub: user.id,
    role: user.role,
    type,
  })
    .setProtectedHeader({
      alg: "RS256",
      typ: "JWT",
      kid: activeKid,
    })
    .setSubject(String(user.id))
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setIssuer(policy.issuer)
    .setAudience(policy.audience)
    .setExpirationTime(Math.floor(Date.now() / 1000) + (type === "access" ? policy.accessTtlSeconds : policy.refreshTtlSeconds))
    .sign(privateKey);
}

export function sanitizeUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function saveRefreshToken(
  prisma: PrismaClientOrTx,
  userId: string,
  token: string,
): Promise<{ id: string }> {
  const tokenHash = hashRefreshToken(token);
  try {
    const decoded = await verifyAuthToken(token, getPublicKey, "refresh", policy);
    if (typeof decoded.exp !== "number") {
      throw new BadRequestError("Refresh token missing exp");
    }
    if (decoded.sub !== userId) throw new BadRequestError("Invalid refresh token");
    const expiresAt = new Date(decoded.exp * 1000);

    return prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });
  } catch (error) {
    if (isAuthTokenError(error) || error instanceof UnauthorizedError || error instanceof BadRequestError) {
      throw new BadRequestError("Invalid refresh token", undefined, "BAD_REQUEST", error);
    }
    throw error;
  }
}

export async function revokeAllActiveRefreshTokens(userId: string, prisma: PrismaClientOrTx) {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}

export async function revokeRefreshToken(prisma: PrismaClientOrTx, token: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const current = await tx.refreshToken.findUnique({ where: { tokenHash: hashRefreshToken(token) } });
    if (!current) return;
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${current.userId} FOR UPDATE`;
    if (current.expiresAt <= new Date()) return;
    await revokeAllActiveRefreshTokens(current.userId, tx);
  });
}

export async function cleanupRefreshTokens(prisma: PrismaClientOrTx): Promise<number> {
  const cleanupThreshold = new Date(
    Date.now() - REFRESH_TOKEN_CLEANUP_AFTER_DAYS * 24 * 60 * 60 * 1000,
  );

  const result = await prisma.refreshToken.deleteMany({
    // Retain revoked evidence for the token's entire possible validity period.
    where: { expiresAt: { lt: cleanupThreshold } },
  });

  return result.count;
}

export async function rotateRefreshToken(prisma: PrismaClientOrTx, currentToken: string, userId: string, nextToken: string): Promise<{ id: string }> {
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    const current = await tx.refreshToken.findUnique({ where: { tokenHash: hashRefreshToken(currentToken) } });
    if (!current || current.userId !== userId || current.expiresAt <= new Date()) return null;
    if (current.revokedAt) {
      await revokeAllActiveRefreshTokens(userId, tx);
      return null; // Commit reuse revocation before returning an external rejection.
    }
    const created = await saveRefreshToken(tx, userId, nextToken);
    await tx.refreshToken.update({ where: { id: current.id }, data: { revokedAt: new Date(), replacedByTokenId: created.id } });
    return created;
  });
  if (!result) throw new UnauthorizedError("Invalid or revoked refresh token");
  return result;
}
