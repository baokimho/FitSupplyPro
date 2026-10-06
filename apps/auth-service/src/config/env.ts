import { parseLogLevel, parseNodeEnv, parsePort, requireEnvString, optionalEnvString } from "@shared/utils";

export function loadConfig(env: NodeJS.ProcessEnv) {
  return {
    logLevel: parseLogLevel("LOG_LEVEL", env.LOG_LEVEL),
    nodeEnv: parseNodeEnv("NODE_ENV", env.NODE_ENV, "development"),
    port: parsePort("PORT", env.PORT, 3001),
    gatewaySecret: requireEnvString("GATEWAY_SECRET", env.GATEWAY_SECRET),
    databaseUrl: requireEnvString("DATABASE_URL", env.DATABASE_URL),
    jwtPrivateKeyBase64: optionalEnvString("JWT_PRIVATE_KEY_BASE64", env.JWT_PRIVATE_KEY_BASE64),
    jwtPublicKeyBase64: optionalEnvString("JWT_PUBLIC_KEY_BASE64", env.JWT_PUBLIC_KEY_BASE64),
  };
}

export type AuthServiceConfig = ReturnType<typeof loadConfig>;
