import crypto from "crypto";
import path from "path";
import type { AuthTokenPayload, AuthTokenType, AuthUser, PrismaClientOrTx, JWKSResponse } from "../types/auth.js";
import type { User } from "@prisma/client";
import { importJWK, JWK, CryptoKey, SignJWT, jwtVerify } from "jose";
import { readFileSync } from "fs";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const JWT_ALGORITHM = "RS256";
const REFRESH_TOKEN_CLEANUP_AFTER_DAYS = 14;
const JWT_ISSUER = 'fitsupply-auth-service';
const JWT_AUDIENCE = 'fitsupply-api';

const privateKeyPath = path.resolve(process.cwd(), 'apps/auth-service/keys/private.json')
const publicKeyPath = path.resolve(process.cwd(), 'apps/auth-service/keys/public.json')

let cachedPrivateJWK: JWK | null = null 
let cachedPrivateKey: CryptoKey | null = null;
async function getPrivateKey(): Promise<CryptoKey> {
  if (cachedPrivateKey) return cachedPrivateKey;
  if (!cachedPrivateJWK) {
  const privateJWK = readFileSync(privateKeyPath, 'utf-8');
  cachedPrivateJWK = JSON.parse(privateJWK) as JWK;
  }

  if (!cachedPrivateJWK) {
    throw new Error("JWT_PRIVATE_KEY is required");
  }

  cachedPrivateKey = await importJWK(cachedPrivateJWK, 'RS256') as CryptoKey;
  return cachedPrivateKey 
}

let cachedJWKS: JWKSResponse | null = null;
export async function getJWKS(): Promise<JWKSResponse> {
  if (cachedJWKS) return cachedJWKS;
  const publicJWK = readFileSync(publicKeyPath, 'utf-8');
  const publicKey = JSON.parse(publicJWK);

  if (!publicKey) {
    throw new Error("JWY_PUBLIC_KEY is required");
  }
  cachedJWKS = {
    keys: [publicKey as JWK],
  }
  return cachedJWKS!
}

let cachedPublicKey: CryptoKey | null = null;
export async function getPublicKey(): Promise<CryptoKey> {
  if (cachedPublicKey) return cachedPublicKey;
  const publicJWK = readFileSync(publicKeyPath, 'utf-8');
  const publicKey = JSON.parse(publicJWK);

  if (!publicKey) {
    throw new Error("JWY_PUBLIC_KEY is required");
  }
  cachedPublicKey = await importJWK(publicKey as JWK, 'RS256') as CryptoKey
  return cachedPublicKey
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

export async function createAuthToken(
  user: User,
  type: AuthTokenType = "access",
) {
  const privateKey = await getPrivateKey()
  return await new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    type,
  })
    .setProtectedHeader({
      alg: 'RS256', 
      typ: 'JWT',
      kid: cachedPrivateJWK?.kid
    })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(type === 'access' ? '15m' : '7d')
    .sign(privateKey)
}

export async function verifyAuthToken(
  token: string,
  expectedType?: AuthTokenType,
): Promise<AuthTokenPayload> {
  const publicKey = await getPublicKey()
  const { payload } = await jwtVerify<AuthTokenPayload>(token, publicKey, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: ['RS256']
  });

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
  try{
    const decoded = await verifyAuthToken(token, "refresh");
    if (typeof decoded.exp !== 'number') {
      throw new Error("Refresh token missing exp")
    };
    const expiresAt = new Date(decoded.exp * 1000)

    return prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });
  } catch {
    throw new Error('Invalid refresh token')
  }

}

export async function findActiveRefreshToken(
  prisma: PrismaClientOrTx,
  token: string,
): Promise<{ id: string; userId: string } | null> {
  await verifyAuthToken(token, "refresh")
  const tokenHash = hashRefreshToken(token);

  const refreshToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!refreshToken) {
    return null 
  }

  if (refreshToken.revokedAt) {
    await revokeAllActiveRefreshTokens(refreshToken.userId, prisma)
    throw new Error("Refresh token reuse detected")
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
      revokedAt: null
    },
    data: { revokedAt: new Date() }
  })
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