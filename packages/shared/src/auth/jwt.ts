import { errors, importJWK, jwtVerify, type CryptoKey, type JWTPayload, type JWK, type JWTVerifyGetKey } from "jose";
import { UnauthorizedError, ServiceUnavailableError } from "../errors/httpErrors.js";
import { correlationHeaders } from "../http/correlation.js";
import { fetchDependency } from "../resilience/timeout.js";
import { readResilienceConfig } from "../resilience/config.js";
import { createLogger } from "../logging/logger.js";
import { parseNodeEnv } from "../config/env.js";
import { readAuthPolicy, validKeyId, type AuthPolicy, type AuthRole } from "./policy.js";
import { validCorrelationId } from "../http/correlation.js";

export type AuthTokenType = "access" | "refresh";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthSessionUser = {
  id: string;
  role: AuthRole;
};

export type AuthTokenPayload = JWTPayload & {
  sub: string;
  role: AuthRole;
  type: AuthTokenType;
  iat: number;
  exp: number;
  jti: string;
};

export type JWKSResponse = {
  keys: JWK[];
};

/** Public key projection also rejects private material before JOSE import. */
export function publicVerificationJwk(value: unknown): JWK {
  if (typeof value !== "object" || value === null) throw new Error("Invalid verification key");
  const key = value as JWK;
  if (key.kty !== "RSA" || !validKeyId(key.kid) || key.alg !== "RS256" || key.use !== "sig" ||
    typeof key.n !== "string" || !/^[a-zA-Z0-9_-]+$/.test(key.n) || Buffer.from(key.n, "base64url").length < 256 || key.e !== "AQAB" ||
    ["d", "p", "q", "dp", "dq", "qi", "oth", "k"].some((field) => field in key) ||
    (key.key_ops !== undefined && (key.key_ops.length !== 1 || key.key_ops[0] !== "verify"))) throw new Error("Invalid verification key");
  return { kty: "RSA", kid: key.kid, alg: "RS256", use: "sig", n: key.n, e: key.e };
}

export function isAuthTokenError(error: unknown): boolean {
  return error instanceof errors.JWTExpired || error instanceof errors.JWTClaimValidationFailed ||
    error instanceof errors.JWTInvalid || error instanceof errors.JWSInvalid ||
    error instanceof errors.JOSEAlgNotAllowed || error instanceof errors.JWSSignatureVerificationFailed;
}

/** Per-loader bounded cache, single-flight fetch, global cooldown, bounded stale use. */
export function createPublicKeyLoader(authServiceUrl: string, gatewaySecret: string | (() => string), policy: AuthPolicy = readAuthPolicy()) {
  const { timeoutMs } = readResilienceConfig();
  const logger = createLogger({ service: "auth-client", environment: parseNodeEnv("NODE_ENV", process.env.NODE_ENV, "development") });
  let keys = new Map<string, CryptoKey>();
  let fetchedAt = -Infinity;
  let nextRefreshAt = -Infinity;
  let pending: Promise<void> | undefined;
  let failed = false;

  async function refresh() {
    if (pending) return pending;
    nextRefreshAt = Date.now() + policy.jwksCooldownMs;
    pending = (async () => {
      try {
        const { response, text } = await fetchDependency(new URL("/jwks", authServiceUrl), {
          redirect: "error",
          headers: { ...correlationHeaders(), "x-internal-secret": typeof gatewaySecret === "function" ? gatewaySecret() : gatewaySecret }
        }, { dependency: "auth-service", operation: "jwks", timeoutMs, safe: true, logger });
        if (!response.ok || text.length > 65536) throw new Error();
        const data: unknown = JSON.parse(text);
        if (typeof data !== "object" || data === null || !("keys" in data) || !Array.isArray(data.keys) || data.keys.length < 1 || data.keys.length > 8) throw new Error();
        const updated = new Map<string, CryptoKey>();
        for (const entry of data.keys) {
          const jwk = publicVerificationJwk(entry);
          if (updated.has(jwk.kid!)) throw new Error();
          updated.set(jwk.kid!, await importJWK(jwk, "RS256") as CryptoKey);
        }
        keys = updated;
        fetchedAt = Date.now();
        failed = false;
      } catch {
        failed = true;
        throw new ServiceUnavailableError("Authentication service unavailable");
      }
    })().finally(() => { pending = undefined; });
    return pending;
  }

  return async function getPublicKey(header: { alg?: string; kid?: string } = {}): Promise<CryptoKey> {
    if (header.alg !== "RS256" || !validKeyId(header.kid)) throw new UnauthorizedError("Invalid token");
    const cached = keys.get(header.kid);
    if (cached && Date.now() - fetchedAt < policy.jwksCacheTtlMs) return cached;
    if (pending || Date.now() >= nextRefreshAt) {
      try { await refresh(); }
      catch (error) {
        if (cached && Date.now() - fetchedAt < policy.jwksCacheTtlMs + policy.jwksStaleMs) return cached;
        throw error;
      }
    }
    const key = keys.get(header.kid);
    if (key && Date.now() - fetchedAt < policy.jwksCacheTtlMs + policy.jwksStaleMs) return key;
    if (failed) throw new ServiceUnavailableError("Authentication service unavailable");
    throw new UnauthorizedError("Invalid token");
  };
}

let defaultPublicKeyLoader: ReturnType<typeof createPublicKeyLoader> | undefined;
export async function getPublicKey(header: { alg?: string; kid?: string }) {
  defaultPublicKeyLoader ??= createPublicKeyLoader(process.env.AUTH_SERVICE_URL || "http://auth-service:3001", () => process.env.GATEWAY_SECRET || "");
  return defaultPublicKeyLoader(header);
}

export async function verifyAuthToken(token: string, publicKey: CryptoKey | JWTVerifyGetKey,
  expectedType?: AuthTokenType, policy: AuthPolicy = readAuthPolicy()): Promise<AuthTokenPayload> {
  const options = { issuer: policy.issuer, audience: policy.audience, algorithms: ["RS256"], typ: "JWT",
    requiredClaims: ["sub", "iat", "exp", "jti", "type", "role"], clockTolerance: policy.clockToleranceSeconds };
  const result = typeof publicKey === "function" ? await jwtVerify(token, publicKey, options) : await jwtVerify(token, publicKey, options);
  const { payload, protectedHeader } = result;
  const ttl = payload.type === "access" ? policy.accessTtlSeconds : policy.refreshTtlSeconds;
  if (!validKeyId(protectedHeader.kid) || typeof payload.sub !== "string" || !payload.sub.trim() || payload.sub.length > 200 ||
    !validCorrelationId(payload.jti) || (payload.role !== "CUSTOMER" && payload.role !== "ADMIN") ||
    (payload.type !== "access" && payload.type !== "refresh") || (expectedType !== undefined && payload.type !== expectedType) ||
    !Number.isSafeInteger(payload.iat) || !Number.isSafeInteger(payload.exp) || typeof payload.iat !== "number" || typeof payload.exp !== "number" ||
    payload.iat > Date.now() / 1000 + policy.clockToleranceSeconds || payload.exp <= payload.iat || payload.exp - payload.iat > ttl) {
    throw new UnauthorizedError("Invalid token");
  }
  return payload as AuthTokenPayload;
}
