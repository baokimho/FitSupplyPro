import { describe, expect, it, vi } from "vitest";
import { logger } from "./logger.js";

vi.mock("./config/index.js", async () => {
  const { loadConfig } = await import("./config/env.js");
  return { config: loadConfig({ NODE_ENV: "test", LOG_LEVEL: "debug", GATEWAY_SECRET: "test-secret", DATABASE_URL: "postgresql://test:test@localhost/test_db" }) };
});

describe("order-service logger", () => {
  it("uses service identity and validated environment/level without config secrets", () => {
    expect(logger.bindings()).toEqual({ service: "order-service", environment: "test" });
    expect(logger.level).toBe("debug");
  });
});
