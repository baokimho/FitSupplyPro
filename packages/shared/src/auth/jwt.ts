import { jwtVerify, type CryptoKey, type JWTPayload, type JWK } from "jose";

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
    throw new Error("Invalid token type");
  }

  return payload;
}