import { parseNodeEnv, parsePort, requireEnvString } from "@shared/utils";

export function loadConfig(env: NodeJS.ProcessEnv) {
  return {
    nodeEnv: parseNodeEnv("NODE_ENV", env.NODE_ENV, "development"),
    port: parsePort("PORT", env.PORT, 3002),
    gatewaySecret: requireEnvString("GATEWAY_SECRET", env.GATEWAY_SECRET),
    databaseUrl: requireEnvString("DATABASE_URL", env.DATABASE_URL),
  };
}

export type CatalogServiceConfig = ReturnType<typeof loadConfig>;
