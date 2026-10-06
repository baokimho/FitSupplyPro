import pino, { type DestinationStream, type Logger } from "pino";
import { ConfigurationError, type NodeEnv } from "../config/env.js";
import { getCorrelation } from "../http/correlation.js";

export type { Logger } from "pino";
export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";

export function parseLogLevel(name: string, value: string | undefined): LogLevel {
  const level = value ?? "info";
  if (level !== "fatal" && level !== "error" && level !== "warn" && level !== "info" &&
      level !== "debug" && level !== "trace" && level !== "silent") {
    throw new ConfigurationError(name, "must be fatal, error, warn, info, debug, trace, or silent");
  }
  return level;
}

const sensitiveFields = [
  "authorization", "Authorization", "cookie", "Cookie", "set-cookie", "Set-Cookie",
  "password", "passwordHash", "token", "accessToken", "refreshToken", "tokenHash",
  "DATABASE_URL", "databaseUrl", "GATEWAY_SECRET", "gatewaySecret",
  "JWT_PRIVATE_KEY_BASE64", "JWT_PUBLIC_KEY_BASE64", "jwtPrivateKeyBase64", "jwtPublicKeyBase64",
  "privateKey", "publicKey", "x-gateway-secret", "x-internal-secret",
];

// Defense in depth for known fields, including child bindings and request-shaped objects.
const redactPaths = sensitiveFields.flatMap((field) => [
  `["${field}"]`, `*["${field}"]`, `*.*["${field}"]`,
]);

function serializeError(error: unknown) {
  if (!(error instanceof Error)) return { type: "UnknownError" };
  const serialized = pino.stdSerializers.err(error);
  // Keep error diagnostics; omit arbitrary attached bodies/config/driver metadata.
  const clean = (text: string) => text
    .replace(/\b(?:postgres(?:ql)?|https?):\/\/[^\s/@]+:[^\s/@]+@[^\s)]+/gi, "[Redacted URL]")
    .replace(/\bBearer\s+[^\s]+/gi, "Bearer [Redacted]")
    .replace(/-----BEGIN [^-]*KEY-----[\s\S]*?-----END [^-]*KEY-----/g, "[Redacted key]");
  return { type: serialized.type, message: clean(serialized.message), stack: clean(serialized.stack ?? "") };
}

export function createLogger(
  options: { service: string; environment: NodeEnv; level?: LogLevel },
  destination?: DestinationStream,
): Logger {
  return pino({
    base: { service: options.service, environment: options.environment },
    level: options.level ?? "info",
    mixin: () => ({ ...getCorrelation() }),
    serializers: { err: serializeError },
    redact: { paths: redactPaths, censor: "[Redacted]" },
  }, destination);
}
