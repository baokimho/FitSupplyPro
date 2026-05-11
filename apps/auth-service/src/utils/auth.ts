import crypto from "crypto";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { Role, User } from "@prisma/client";

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_EXPIRES_IN = "7d";
const JWT_ALGORITHM = "RS256";

export type AuthTokenType = "access" | "refresh";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

type AuthTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  name: string;
  role: Role;
  type: AuthTokenType;
};

function normalizeKey(value: string): string {
  return value.replace(/\\n/g, "\n").trim();
}

function getPrivateKey(): string {
  const privateKey = process.env.JWT_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("JWT_PRIVATE_KEY is required");
  }

  return normalizeKey(privateKey);
}

function getPublicKey(): string {
  const publicKey = process.env.JWT_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error("JWT_PUBLIC_KEY is required");
  }

  return normalizeKey(publicKey);
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

function getTokenOptions(type: AuthTokenType): SignOptions {
  return {
    algorithm: JWT_ALGORITHM,
    expiresIn: type === "refresh" ? REFRESH_TOKEN_EXPIRES_IN : ACCESS_TOKEN_EXPIRES_IN,
  };
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