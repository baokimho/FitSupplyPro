import crypto from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { AuthTokenPayload, AuthTokenType, AuthUser, PrismaClientOrTx } from "../types/auth.js";
import type { User } from "@prisma/client";
import { importJWK, JWK, CryptoKey } from "jose";
import { readFileSync } from "fs";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const JWT_ALGORITHM = "RS256";
const REFRESH_TOKEN_CLEANUP_AFTER_DAYS = 14;

function normalizeKey(value: string): string {
  return value.replace(/\\n/g, "\n").trim();
}

let cachedPrivateKey: CryptoKey | null = null;
async function getPrivateKey(): Promise<CryptoKey> {
  if (cachedPrivateKey) return cachedPrivateKey;
  const privateJWK = await readFileSync('../keys/private.json', 'utf-8');
  const privateKey = JSON.parse(privateJWK);

  if (!privateKey) {
    throw new Error("JWT_PRIVATE_KEY is required");
  }

  cachedPrivateKey = await importJWK(privateKey as JWK, 'RS256') as CryptoKey;
  return cachedPrivateKey 
}

function getPublicKey(): string {
  const publicKey = process.env.JWT_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error("JWT_PUBLIC_KEY is required");
  }

  return normalizeKey(publicKey);
}

function getTokenOptions(type: AuthTokenType): SignOptions {
  return {
    algorithm: JWT_ALGORITHM,
    expiresIn: type === "refresh" ? REFRESH_TOKEN_EXPIRES_IN : ACCESS_TOKEN_EXPIRES_IN,
  };
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");

  return `${salt}:${derived}`;
}

export function comparePassword(password: string, passwordHash: string): boolean {
  const [salt, storedHash] = passwordHash.split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const derived = crypto.scryptSync(password, salt, 64).toString("hex");

  if (storedHash.length !== derived.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(storedHash, "hex"),
    Buffer.from(derived, "hex"),
  );
}

export function createAuthToken(
  user: User,
  type: AuthTokenType = "access",
): string {
  const payload: AuthTokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    type,
  };

  return jwt.sign(payload, getPrivateKey(), getTokenOptions(type));
}

export function verifyAuthToken(
  token: string,
  expectedType?: AuthTokenType,
): AuthTokenPayload {
  const payload = jwt.verify(token, getPublicKey(), {
    algorithms: [JWT_ALGORITHM],
  }) as AuthTokenPayload;

  if (expectedType && payload.type !== expectedType) {
    throw new Error("Invalid token type");
  }

  return payload;
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
  const decoded = verifyAuthToken(token, "refresh");
  const expiresAt = typeof decoded.exp === "number"
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });
}

export async function findActiveRefreshToken(
  prisma: PrismaClientOrTx,
  token: string,
): Promise<{ id: string; userId: string } | null> {
  const tokenHash = hashRefreshToken(token);

  const refreshToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!refreshToken || refreshToken.revokedAt) {
    return null;
  }

  if (new Date() > refreshToken.expiresAt) {
    return null;
  }

  return {
    id: refreshToken.id,
    userId: refreshToken.userId,
  };
}

export async function revokeRefreshToken(
  prisma: PrismaClientOrTx,
  token: string,
): Promise<void> {
  const tokenHash = hashRefreshToken(token);

  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });
}

export async function cleanupRefreshTokens(
  prisma: PrismaClientOrTx,
): Promise<number> {
  const cleanupThreshold = new Date(
    Date.now() - REFRESH_TOKEN_CLEANUP_AFTER_DAYS * 24 * 60 * 60 * 1000,
  );

  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        {
          revokedAt: {
            lt: cleanupThreshold,
          },
        },
        {
          expiresAt: {
            lt: cleanupThreshold,
          },
        },
      ],
    },
  });

  return result.count;
}

export async function rotateRefreshToken(
  prisma: PrismaClientOrTx,
  currentToken: string,
  userId: string,
  nextToken: string,
): Promise<{ id: string }> {
  const currentTokenHash = hashRefreshToken(currentToken);
  return prisma.$transaction(async (tx) => {
    const current = await tx.refreshToken.findUnique({
      where: { tokenHash: currentTokenHash },
    });

    if (!current) {
      throw new Error("Refresh token not found");
    }

    const created = await saveRefreshToken(tx, userId, nextToken);

    await tx.refreshToken.update({
      where: { id: current.id },
      data: {
        revokedAt: new Date(),
        replacedByTokenId: created.id,
      },
    });

    return created;
  });
}