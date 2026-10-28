import { parseLogLevel, parseNodeEnv, parsePort, readRabbitMqConfig, requireEnvString } from "@shared/utils";
import { defaultEmailPolicy } from "../domain/notification.js";

export function loadConfig(env: NodeJS.ProcessEnv) {
  if ((env.EMAIL_PROVIDER ?? "fake") !== "fake") throw new Error("EMAIL_PROVIDER must be fake");
  const raw = env.EMAIL_MAX_ATTEMPTS ?? String(defaultEmailPolicy.maxAttempts);
  const maxAttempts = Number(raw);
  if (!/^[1-5]$/.test(raw)) throw new Error("EMAIL_MAX_ATTEMPTS must be an integer from 1 to 5");
  return { broker: readRabbitMqConfig(env), port: parsePort("PORT", env.PORT, 3008),
    nodeEnv: parseNodeEnv("NODE_ENV", env.NODE_ENV, "development"), logLevel: parseLogLevel("LOG_LEVEL", env.LOG_LEVEL),
    gatewaySecret: requireEnvString("GATEWAY_SECRET", env.GATEWAY_SECRET),
    emailPolicy: { ...defaultEmailPolicy, maxAttempts } };
}
