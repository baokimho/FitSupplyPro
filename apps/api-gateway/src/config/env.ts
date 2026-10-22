import { readProxyTimeout, parseLogLevel, parseNodeEnv, parsePort, requireEnvString, parseUrl, ConfigurationError } from "@shared/utils";

function integer(env: NodeJS.ProcessEnv, name: string, fallback: number, max: number) {
  const value = env[name];
  const result = value === undefined ? fallback : Number(value);
  if ((value !== undefined && !/^\d+$/.test(value)) || !Number.isSafeInteger(result) || result < 1 || result > max) {
    throw new ConfigurationError(name, "must be an integer within the documented resilience range");
  }
  return result;
}

function origin(name: string, value: string) {
  const parsed = new URL(parseUrl(name, value));
  if (parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") {
    throw new ConfigurationError(name, "must be a complete HTTP(S) URL");
  }
  return value;
}

export function loadConfig(env: NodeJS.ProcessEnv) {
  const nodeEnv = parseNodeEnv("NODE_ENV", env.NODE_ENV, "development");
  const corsOrigins = (env.CORS_ALLOWED_ORIGINS ?? (nodeEnv === "production" ? "" : "http://localhost:5173,http://localhost:3000"))
    .split(",").filter(Boolean).map((value) => new URL(origin("CORS_ALLOWED_ORIGINS", value)).origin);
  if (nodeEnv === "production" && !env.CORS_ALLOWED_ORIGINS) requireEnvString("CORS_ALLOWED_ORIGINS", env.CORS_ALLOWED_ORIGINS);
  const serviceUrl = (name: string, fallback: string) => origin(name,
    nodeEnv === "production" ? requireEnvString(name, env[name]) : env[name] ?? fallback);
  return {
    bodyLimitBytes: integer(env, "GATEWAY_BODY_LIMIT_BYTES", 1_048_576, 10_485_760),
    rateWindowMs: integer(env, "GATEWAY_RATE_WINDOW_MS", 60_000, 3_600_000),
    rateLimit: integer(env, "GATEWAY_RATE_LIMIT", 600, 100_000),
    authRateLimit: integer(env, "GATEWAY_AUTH_RATE_LIMIT", 5, 100_000),
    refreshRateLimit: integer(env, "GATEWAY_REFRESH_RATE_LIMIT", 30, 100_000),
    corsOrigins,
    proxyTimeoutMs: readProxyTimeout(env),
    logLevel: parseLogLevel("LOG_LEVEL", env.LOG_LEVEL),
    nodeEnv,
    port: parsePort("PORT", env.PORT, 3000),
    gatewaySecret: requireEnvString("GATEWAY_SECRET", env.GATEWAY_SECRET),
    authServiceUrl: serviceUrl("AUTH_SERVICE_URL", "http://localhost:3001"),
    catalogServiceUrl: serviceUrl("CATALOG_SERVICE_URL", "http://localhost:3002"),
    inventoryServiceUrl: serviceUrl("INVENTORY_SERVICE_URL", "http://localhost:3004"),
    orderServiceUrl: serviceUrl("ORDER_SERVICE_URL", "http://localhost:3003"),
    cartServiceUrl: serviceUrl("CART_SERVICE_URL", "http://localhost:3005"),
    paymentServiceUrl: serviceUrl("PAYMENT_SERVICE_URL", "http://localhost:3006"),
    shippingServiceUrl: serviceUrl("SHIPPING_SERVICE_URL", "http://localhost:3007"),
    notificationServiceUrl: serviceUrl("NOTIFICATION_SERVICE_URL", "http://localhost:3008"),
    jwksAuthServiceUrl: serviceUrl("AUTH_SERVICE_URL", "http://auth-service:3001"),
  };
}

export type ApiGatewayConfig = ReturnType<typeof loadConfig>;
