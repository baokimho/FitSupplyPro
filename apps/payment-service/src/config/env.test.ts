import { describe, expect, it } from "vitest";
import { loadConfig } from "./env.js";

const env = { GATEWAY_SECRET: "test-secret", DATABASE_URL: "postgresql://test:test@localhost/test_db" };

describe("payment configuration", () => {
  it("allows forced checkout provider outcome only in disposable test mode", () => {
    expect(loadConfig({ ...env, NODE_ENV: "test", TEST_CHECKOUT_PAYMENT_OUTCOME: "FAILED" }).checkoutPaymentOutcome).toBe("FAILED");
    expect(() => loadConfig({ ...env, NODE_ENV: "production", TEST_CHECKOUT_PAYMENT_OUTCOME: "FAILED" })).toThrow();
    expect(() => loadConfig({ ...env, NODE_ENV: "test", TEST_CHECKOUT_PAYMENT_OUTCOME: "unknown" })).toThrow();
  });
  it("preserves shared defaults and validates required values", () => {
    expect(loadConfig(env)).toMatchObject({ port: 3006, nodeEnv: "development", logLevel: "info", orderServiceUrl: "http://order-service:3003" });
    for (const variable of ["GATEWAY_SECRET", "DATABASE_URL"]) {
      expect(() => loadConfig({ ...env, [variable]: undefined })).toThrow(`Configuration variable ${variable} is required`);
    }
  });

  it("rejects invalid ports, URLs, environments and log levels", () => {
    for (const overrides of [{ PORT: "0" }, { PORT: "invalid" }, { ORDER_SERVICE_URL: "postgresql://localhost/db" }, { NODE_ENV: "staging" }, { LOG_LEVEL: "unknown" }]) {
      expect(() => loadConfig({ ...env, ...overrides })).toThrow();
    }
    expect(loadConfig({ ...env, PORT: "4100", ORDER_SERVICE_URL: "https://order.test", NODE_ENV: "test", LOG_LEVEL: "debug" })).toMatchObject({ port: 4100, orderServiceUrl: "https://order.test", nodeEnv: "test", logLevel: "debug" });
  });
});
