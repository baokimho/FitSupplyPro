import { parseLogLevel, parseNodeEnv, parsePort, requireEnvString, parseUrl } from "@shared/utils";

export function loadConfig(env: NodeJS.ProcessEnv) {
  return {
    logLevel: parseLogLevel("LOG_LEVEL", env.LOG_LEVEL),
    nodeEnv: parseNodeEnv("NODE_ENV", env.NODE_ENV, "development"),
    port: parsePort("PORT", env.PORT, 3003),
    gatewaySecret: requireEnvString("GATEWAY_SECRET", env.GATEWAY_SECRET),
    databaseUrl: requireEnvString("DATABASE_URL", env.DATABASE_URL),
    catalogServiceUrl: parseUrl("CATALOG_SERVICE_URL", env.CATALOG_SERVICE_URL ?? "http://catalog-service:3002"),
    inventoryServiceUrl: parseUrl("INVENTORY_SERVICE_URL", env.INVENTORY_SERVICE_URL ?? "http://inventory-service:3004"),
    cartServiceUrl: parseUrl("CART_SERVICE_URL", env.CART_SERVICE_URL ?? "http://cart-service:3005"),
    notificationServiceUrl: parseUrl("NOTIFICATION_SERVICE_URL", env.NOTIFICATION_SERVICE_URL ?? "http://notification-service:3008"),
  };
}

export type OrderServiceConfig = ReturnType<typeof loadConfig>;
