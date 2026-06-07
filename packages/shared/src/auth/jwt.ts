import { importJWK, jwtVerify, type CryptoKey, type JWTPayload, type JWK } from "jose";
import { UnauthorizedError } from "../errors/httpErrors.js";

export type AuthTokenType = "access" | "refresh";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthSessionUser = {
  id: string;
  role: string;
};

export type AuthTokenPayload = JWTPayload & {
  sub: string;
  email: string;
  name: string;
  role: string;
  type: AuthTokenType;
};

export type JWKSResponse = {
  keys: JWK[];
};

const JWT_ISSUER = "fitsupply-auth-service";
const JWT_AUDIENCE = "fitsupply-api";
const authServiceUrl = process.env.AUTH_SERVICE_URL || "http://auth-service:3001";

let cachedPublicKey: CryptoKey | null = null;
let publicKeyPromise: Promise<CryptoKey> | null = null;

export async function getPublicKey(): Promise<CryptoKey> {
  if (cachedPublicKey) {
    return cachedPublicKey;
  }

  if (!publicKeyPromise) {
    publicKeyPromise = (async () => {
      const response = await fetch(new URL("/jwks", authServiceUrl), {
        headers: {
          "x-internal-secret": process.env.GATEWAY_SECRET || "",
        }
      }
    );

      if (!response.ok) {
        throw new Error(`Unable to load public key from auth service: ${response.status}`);
      }

      const jwks = (await response.json()) as JWKSResponse;
      const publicKey = jwks.keys[0];

      if (!publicKey) {
        throw new Error("Auth service JWKS is empty");
      }

      cachedPublicKey = (await importJWK(publicKey, "RS256")) as CryptoKey;
      return cachedPublicKey;
    })().catch((error) => {
      publicKeyPromise = null;
      throw error;
    });
  }

  return publicKeyPromise;
}

export async function verifyAuthToken(
  token: string,
  publicKey: CryptoKey,
  expectedType?: AuthTokenType,
): Promise<AuthTokenPayload> {
  const { payload } = await jwtVerify<AuthTokenPayload>(token, publicKey, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: ["RS256"],
  });

  if (expectedType && payload.type !== expectedType) {
    throw new UnauthorizedError("Invalid token type");
  }

  return payload;
}