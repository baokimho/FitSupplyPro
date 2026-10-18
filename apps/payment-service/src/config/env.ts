import { readResilienceConfig, readCheckoutConfig, parseLogLevel, parseNodeEnv, parsePort, requireEnvString, parseUrl } from "@shared/utils";

export function loadConfig(env: NodeJS.ProcessEnv) {
  const outcome = env.TEST_CHECKOUT_PAYMENT_OUTCOME ?? "SUCCEEDED";
  if ((outcome !== "SUCCEEDED" && outcome !== "FAILED") || (env.TEST_CHECKOUT_PAYMENT_OUTCOME !== undefined && env.NODE_ENV !== "test")) {
    throw new Error("TEST_CHECKOUT_PAYMENT_OUTCOME requires test environment and SUCCEEDED or FAILED");
  }
  return {
    checkoutPaymentOutcome: outcome === "FAILED" ? "FAILED" as const : "SUCCEEDED" as const,
    checkout: readCheckoutConfig(env),
    resilience: readResilienceConfig(env),
    logLevel: parseLogLevel("LOG_LEVEL", env.LOG_LEVEL),
    nodeEnv: parseNodeEnv("NODE_ENV", env.NODE_ENV, "development"),
    port: parsePort("PORT", env.PORT, 3006),
    gatewaySecret: requireEnvString("GATEWAY_SECRET", env.GATEWAY_SECRET),
    databaseUrl: requireEnvString("DATABASE_URL", env.DATABASE_URL),
    orderServiceUrl: parseUrl("ORDER_SERVICE_URL", env.ORDER_SERVICE_URL ?? "http://order-service:3003"),
  };
}
