import { ConfigurationError, requireEnvString } from "../config/env.js";

export type RabbitMqConfig = Readonly<{ url: string; connectionTimeoutMs: number }>;

export function readRabbitMqConfig(env: NodeJS.ProcessEnv = process.env): RabbitMqConfig {
  const url = requireEnvString("RABBITMQ_URL", env.RABBITMQ_URL);
  try {
    const parsed = new URL(url);
    if (!/^amqps?:\/\/[^/\\\s?#]/i.test(url) || /[\s\\]/.test(url) || !parsed.hostname ||
        (parsed.protocol !== "amqp:" && parsed.protocol !== "amqps:") || parsed.hash) throw new Error();
    decodeURIComponent(parsed.pathname);
    decodeURIComponent(parsed.username);
    decodeURIComponent(parsed.password);
  } catch {
    throw new ConfigurationError("RABBITMQ_URL", "must be a complete AMQP(S) URL");
  }
  const value = env.RABBITMQ_CONNECTION_TIMEOUT_MS ?? "3000";
  const connectionTimeoutMs = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(connectionTimeoutMs) ||
      connectionTimeoutMs < 1 || connectionTimeoutMs > 60000) {
    throw new ConfigurationError("RABBITMQ_CONNECTION_TIMEOUT_MS", "must be an integer from 1 to 60000");
  }
  return { url, connectionTimeoutMs };
}
