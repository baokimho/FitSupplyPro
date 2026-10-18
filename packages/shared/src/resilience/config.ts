import { ConfigurationError } from "../config/env.js";

function integer(env: NodeJS.ProcessEnv, name: string, fallback: number, min = 1, max = 60000) {
  const value = env[name] ?? String(fallback);
  const number = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < min || number > max) {
    throw new ConfigurationError(name, "must be an integer within the documented resilience range");
  }
  return number;
}

export function readResilienceConfig(env: NodeJS.ProcessEnv = process.env) {
  return {
    timeoutMs: integer(env, "DEPENDENCY_TIMEOUT_MS", 2500),
    maxAttempts: integer(env, "DEPENDENCY_MAX_ATTEMPTS", 3, 1, 5),
    baseDelayMs: integer(env, "RETRY_BASE_DELAY_MS", 100),
    maxDelayMs: integer(env, "RETRY_MAX_DELAY_MS", 1000),
  };
}

export function readProxyTimeout(env: NodeJS.ProcessEnv) {
  return integer(env, "PROXY_TIMEOUT_MS", 30000);
}

/** Native pg deadlines bound pool acquisition and cancel server statements. */
export function readDatabaseTimeouts(env: NodeJS.ProcessEnv = process.env) {
  return {
    connectionTimeoutMillis: integer(env, "DB_CONNECT_TIMEOUT_MS", 2500),
    statement_timeout: integer(env, "DB_STATEMENT_TIMEOUT_MS", 5000),
  };
}
