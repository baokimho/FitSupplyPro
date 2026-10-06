import { describe, expect, it } from "vitest";
import { ConfigurationError } from "@shared/utils";
import { loadConfig } from "./env.js";

const env = { GATEWAY_SECRET: "test-secret", DATABASE_URL: "postgresql://test:test@localhost/test_db" };

describe("order-service config", () => {
  it("preserves defaults and database/secret values", () => {
    expect(loadConfig(env)).toMatchObject({
      nodeEnv: "development", port: 3003, gatewaySecret: env.GATEWAY_SECRET,
      databaseUrl: env.DATABASE_URL,
      catalogServiceUrl: "http://catalog-service:3002",
      inventoryServiceUrl: "http://inventory-service:3004",
      cartServiceUrl: "http://cart-service:3005",
      notificationServiceUrl: "http://notification-service:3008",
    });
  });

  it("parses explicit port and environment", () => {
    expect(loadConfig({ ...env, PORT: "4100", NODE_ENV: "production" })).toMatchObject({ port: 4100, nodeEnv: "production" });
    expect(loadConfig({ ...env, NODE_ENV: "test" }).nodeEnv).toBe("test");
  });

  it.each(["GATEWAY_SECRET", "DATABASE_URL"])("requires %s", (variable) => {
    expect(() => loadConfig({ ...env, [variable]: undefined })).toThrow(`Configuration variable ${variable} is required`);
    expect(() => loadConfig({ ...env, [variable]: " " })).toThrow(ConfigurationError);
  });

  it("rejects invalid and blank port/environment", () => {
    for (const PORT of ["invalid", "0", "65536", ""]) expect(() => loadConfig({ ...env, PORT })).toThrow(ConfigurationError);
    for (const NODE_ENV of ["staging", ""]) expect(() => loadConfig({ ...env, NODE_ENV })).toThrow(ConfigurationError);
  });

  it.each([["CATALOG_SERVICE_URL","catalogServiceUrl"],["INVENTORY_SERVICE_URL","inventoryServiceUrl"],["CART_SERVICE_URL","cartServiceUrl"],["NOTIFICATION_SERVICE_URL","notificationServiceUrl"]])("validates %s and preserves override", (variable, field) => {
    expect(loadConfig({ ...env, [variable]: "https://service.test/base" })).toHaveProperty(field, "https://service.test/base");
    for (const value of ["invalid", "postgresql://localhost/db", ""]) {
      expect(() => loadConfig({ ...env, [variable]: value })).toThrow(`Configuration variable ${variable} must`);
    }
  });
});

describe("logging config", () => {
  it("defaults to info and accepts debug", () => {
    expect(loadConfig(env).logLevel).toBe("info");
    expect(loadConfig({ ...env, LOG_LEVEL: "debug" }).logLevel).toBe("debug");
  });

  it.each(["", "unknown"])("rejects invalid LOG_LEVEL: %s", (LOG_LEVEL) => {
    expect(() => loadConfig({ ...env, LOG_LEVEL })).toThrow(ConfigurationError);
  });
});
