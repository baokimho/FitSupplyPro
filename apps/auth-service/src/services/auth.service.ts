import crypto from "crypto";
import path from "path";
import { readFileSync } from "fs";
import { importJWK, JWK, CryptoKey, SignJWT } from "jose";
import {
  UnauthorizedError,
  verifyAuthToken,
  BadRequestError,
  ServiceUnavailableError,
} from "@shared/utils";
import type { AuthTokenType, AuthUser, JWKSResponse } from "@shared/utils";
import type { PrismaClientOrTx } from "../types/db.type.js";
import type { User } from "../generated/prisma/index.js";

const REFRESH_TOKEN_CLEANUP_AFTER_DAYS = 14;
const JWT_ISSUER = "fitsupply-auth-service";
const JWT_AUDIENCE = "fitsupply-api";

const privateKeyPath = path.resolve(process.cwd(), "keys/private.json");
const publicKeyPath = path.resolve(process.cwd(), "keys/public.json");
const privateKeyEnvVar = "JWT_PRIVATE_KEY_BASE64";
const publicKeyEnvVar = "JWT_PUBLIC_KEY_BASE64";

let cachedPrivateJWK: JWK | null = null;
let cachedPrivateKey: CryptoKey | null = null;

function loadJWKFromEnvOrFile(envVar: string, filePath: string, missingMessage: string): JWK {
  const encodedKey = process.env[envVar];

  if (encodedKey) {
    try {
      return JSON.parse(Buffer.from(encodedKey, "base64").toString("utf-8")) as JWK;
    } catch {
      throw new ServiceUnavailableError(`Invalid ${envVar} value`);
    }
  }

  try {
    const keyJson = readFileSync(filePath, "utf-8");
    return JSON.parse(keyJson) as JWK;
  } catch {
    throw new ServiceUnavailableError(missingMessage);
  }
}

async function getPrivateKey(): Promise<CryptoKey> {
  if (cachedPrivateKey) return cachedPrivateKey;
  if (!cachedPrivateJWK) {
    cachedPrivateJWK = loadJWKFromEnvOrFile(
      privateKeyEnvVar,
      privateKeyPath,
      "JWT_PRIVATE_KEY_BASE64 or keys/private.json is required",
    );
  }

  cachedPrivateKey = (await importJWK(cachedPrivateJWK, "RS256")) as CryptoKey;
  return cachedPrivateKey;
}

let cachedJWKS: JWKSResponse | null = null;
export async function getJWKS(): Promise<JWKSResponse> {
  if (cachedJWKS) return cachedJWKS;
  const publicKey = loadJWKFromEnvOrFile(
    publicKeyEnvVar,
    publicKeyPath,
    "JWT_PUBLIC_KEY_BASE64 or keys/public.json is required",
  );

  cachedJWKS = {
    keys: [publicKey],
  };
  return cachedJWKS;
}

export async function getPublicKey(): Promise<CryptoKey> {
  const publicKey = loadJWKFromEnvOrFile(
    publicKeyEnvVar,
    publicKeyPath,
    "JWT_PUBLIC_KEY_BASE64 or keys/public.json is required",
  );

  return (await importJWK(publicKey, "RS256")) as CryptoKey;
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

  return crypto.timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(derived, "hex"));
}

export async function createAuthToken(user: User, type: AuthTokenType = "access") {
  const privateKey = await getPrivateKey();
  return await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    type,
  })
    .setProtectedHeader({
      alg: "RS256",
      typ: "JWT",
      kid: cachedPrivateJWK?.kid,
    })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(type === "access" ? "15m" : "7d")
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
    const decoded = await verifyAuthToken(token, await getPublicKey(), "refresh");
    if (typeof decoded.exp !== "number") {
      throw new BadRequestError("Refresh token missing exp");
    }
    const expiresAt = new Date(decoded.exp * 1000);

    return prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });
  } catch {
    throw new BadRequestError("Invalid refresh token");
  }
}

export async function findActiveRefreshToken(
  prisma: PrismaClientOrTx,
  token: string,
): Promise<{ id: string; userId: string } | null> {
  await verifyAuthToken(token, await getPublicKey(), "refresh");
  const tokenHash = hashRefreshToken(token);

  const refreshToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!refreshToken) {
    return null;
  }

  if (refreshToken.revokedAt) {
    await revokeAllActiveRefreshTokens(refreshToken.userId, prisma);
    throw new UnauthorizedError("Refresh token reuse detected");
  }

  if (new Date() > refreshToken.expiresAt) {
    return null;
  }

  return {
    id: refreshToken.id,
    userId: refreshToken.userId,
  };
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
  const tokenHash = hashRefreshToken(token);

  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revokedAt: new Date() },
  });
}

export async function cleanupRefreshTokens(prisma: PrismaClientOrTx): Promise<number> {
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
      throw new UnauthorizedError("Refresh token not found");
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
