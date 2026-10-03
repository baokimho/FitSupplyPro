import { parseNodeEnv, parsePort, requireEnvString, parseUrl } from "@shared/utils";

export function loadConfig(env: NodeJS.ProcessEnv) {
  return {
    nodeEnv: parseNodeEnv("NODE_ENV", env.NODE_ENV, "development"),
    port: parsePort("PORT", env.PORT, 3000),
    gatewaySecret: requireEnvString("GATEWAY_SECRET", env.GATEWAY_SECRET),
    authServiceUrl: parseUrl("AUTH_SERVICE_URL", env.AUTH_SERVICE_URL ?? "http://localhost:3001"),
    catalogServiceUrl: parseUrl("CATALOG_SERVICE_URL", env.CATALOG_SERVICE_URL ?? "http://localhost:3002"),
    inventoryServiceUrl: parseUrl("INVENTORY_SERVICE_URL", env.INVENTORY_SERVICE_URL ?? "http://localhost:3004"),
    orderServiceUrl: parseUrl("ORDER_SERVICE_URL", env.ORDER_SERVICE_URL ?? "http://localhost:3003"),
    cartServiceUrl: parseUrl("CART_SERVICE_URL", env.CART_SERVICE_URL ?? "http://localhost:3005"),
    paymentServiceUrl: parseUrl("PAYMENT_SERVICE_URL", env.PAYMENT_SERVICE_URL ?? "http://localhost:3006"),
    shippingServiceUrl: parseUrl("SHIPPING_SERVICE_URL", env.SHIPPING_SERVICE_URL ?? "http://localhost:3007"),
    notificationServiceUrl: parseUrl("NOTIFICATION_SERVICE_URL", env.NOTIFICATION_SERVICE_URL ?? "http://localhost:3008"),
    jwksAuthServiceUrl: parseUrl("AUTH_SERVICE_URL", env.AUTH_SERVICE_URL ?? "http://auth-service:3001"),
  };
}

export type ApiGatewayConfig = ReturnType<typeof loadConfig>;
