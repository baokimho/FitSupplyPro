import { ConfigurationError, requireEnvString } from "../config/env.js";

function integer(env: NodeJS.ProcessEnv, name: string, fallback: number, min: number, max: number) {
  const value = env[name] ?? String(fallback);
  const number = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < min || number > max) {
    throw new ConfigurationError(name, "must be an integer within the documented auth range");
  }
  return number;
}

/** One contract for signing and verification. Deploy matching values to callers. */
export function readAuthPolicy(env: NodeJS.ProcessEnv = process.env) {
  return {
    issuer: requireEnvString("JWT_ISSUER", env.JWT_ISSUER ?? "fitsupply-auth-service"),
    audience: requireEnvString("JWT_AUDIENCE", env.JWT_AUDIENCE ?? "fitsupply-api"),
    accessTtlSeconds: integer(env, "JWT_ACCESS_TTL_SECONDS", 900, 60, 3600),
    refreshTtlSeconds: integer(env, "JWT_REFRESH_TTL_SECONDS", 604800, 3600, 2592000),
    clockToleranceSeconds: integer(env, "JWT_CLOCK_TOLERANCE_SECONDS", 5, 0, 60),
    jwksCacheTtlMs: integer(env, "JWKS_CACHE_TTL_MS", 60000, 1000, 3600000),
    jwksStaleMs: integer(env, "JWKS_STALE_MS", 300000, 0, 3600000),
    jwksCooldownMs: integer(env, "JWKS_REFRESH_COOLDOWN_MS", 10000, 1000, 60000),
    keyReloadMs: integer(env, "JWT_KEY_RELOAD_MS", 5000, 100, 60000),
  };
}
export type AuthPolicy = ReturnType<typeof readAuthPolicy>;
export type AuthRole = "CUSTOMER" | "ADMIN";
export const validKeyId = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
