import { describe, expect, it } from "vitest";
import { readRabbitMqConfig } from "./config.js";
import { ConfigurationError } from "../config/env.js";
import { createLogger } from "../logging/logger.js";

describe("RabbitMQ configuration", () => {
  it.each(["amqp://user:password@localhost:5672", "amqps://user:password@broker/%2F"])("accepts %s", (url) => {
    expect(readRabbitMqConfig({ RABBITMQ_URL: url })).toEqual({ url, connectionTimeoutMs: 3000 });
  });
  it.each([undefined, "", " ", "https://broker", "amqp://", "amqp://broker:99999", "amqp://broker/%XX", "amqp://broker/#fragment", "amqp://broker/ with-space"])("rejects invalid URL %s", (url) => {
    expect(() => readRabbitMqConfig({ RABBITMQ_URL: url })).toThrow(ConfigurationError);
  });
  it.each(["", "0", "-1", "1.5", "60001", "NaN"])("rejects timeout %s", (value) => {
    expect(() => readRabbitMqConfig({ RABBITMQ_URL: "amqp://broker", RABBITMQ_CONNECTION_TIMEOUT_MS: value })).toThrow(ConfigurationError);
  });
  it("accepts bounded explicit timeout and keeps credentials out of diagnostics", () => {
    expect(readRabbitMqConfig({ RABBITMQ_URL: "amqp://broker", RABBITMQ_CONNECTION_TIMEOUT_MS: "2500" }).connectionTimeoutMs).toBe(2500);
    expect(() => readRabbitMqConfig({ RABBITMQ_URL: "http://user:secret@broker" })).toThrow("Configuration variable RABBITMQ_URL must be a complete AMQP(S) URL");
    const lines: string[] = [];
    const logger = createLogger({ service: "broker-test", environment: "test" }, { write(line: string) { lines.push(line); } });
    logger.error({ RABBITMQ_URL: "amqp://user:secret@broker", err: new Error("amqps://user:secret@broker failed") }, "failure");
    expect(lines.join("")).not.toContain("secret");
    expect(lines.join("")).toContain("[Redacted");
  });
});
