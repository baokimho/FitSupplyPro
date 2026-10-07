import { parseLogLevel, parseNodeEnv, parsePort, requireEnvString, parseUrl } from "@shared/utils";

export function loadConfig(env: NodeJS.ProcessEnv) {
  return {
    logLevel: parseLogLevel("LOG_LEVEL", env.LOG_LEVEL),
    nodeEnv: parseNodeEnv("NODE_ENV", env.NODE_ENV, "development"),
    port: parsePort("PORT", env.PORT, 3006),
    gatewaySecret: requireEnvString("GATEWAY_SECRET", env.GATEWAY_SECRET),
    databaseUrl: requireEnvString("DATABASE_URL", env.DATABASE_URL),
    orderServiceUrl: parseUrl("ORDER_SERVICE_URL", env.ORDER_SERVICE_URL ?? "http://order-service:3003"),
  };
}
