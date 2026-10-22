import { describe, expect, it } from "vitest";
import { ConfigurationError } from "@shared/utils";
import { loadConfig } from "./env.js";

const env = { GATEWAY_SECRET: "test-secret" };

describe("api-gateway config", () => {
  it("preserves defaults and database/secret values", () => {
    expect(loadConfig(env)).toMatchObject({
      nodeEnv: "development", port: 3000, gatewaySecret: env.GATEWAY_SECRET,
      authServiceUrl: "http://localhost:3001",
      catalogServiceUrl: "http://localhost:3002",
      inventoryServiceUrl: "http://localhost:3004",
      orderServiceUrl: "http://localhost:3003",
      cartServiceUrl: "http://localhost:3005",
      paymentServiceUrl: "http://localhost:3006",
      shippingServiceUrl: "http://localhost:3007",
      notificationServiceUrl: "http://localhost:3008",
    });
  });

  it("parses explicit port and environment", () => {
    expect(loadConfig({ ...env, PORT: "4100", NODE_ENV: "test" })).toMatchObject({ port: 4100, nodeEnv: "test" });
    expect(loadConfig({ ...env, NODE_ENV: "test" }).nodeEnv).toBe("test");
  });

  it.each(["GATEWAY_SECRET"])("requires %s", (variable) => {
    expect(() => loadConfig({ ...env, [variable]: undefined })).toThrow(`Configuration variable ${variable} is required`);
    expect(() => loadConfig({ ...env, [variable]: " " })).toThrow(ConfigurationError);
  });

  it("rejects invalid and blank port/environment", () => {
    for (const PORT of ["invalid", "0", "65536", ""]) expect(() => loadConfig({ ...env, PORT })).toThrow(ConfigurationError);
    for (const NODE_ENV of ["staging", ""]) expect(() => loadConfig({ ...env, NODE_ENV })).toThrow(ConfigurationError);
  });

  it.each([["AUTH_SERVICE_URL","authServiceUrl"],["CATALOG_SERVICE_URL","catalogServiceUrl"],["INVENTORY_SERVICE_URL","inventoryServiceUrl"],["ORDER_SERVICE_URL","orderServiceUrl"],["CART_SERVICE_URL","cartServiceUrl"],["PAYMENT_SERVICE_URL","paymentServiceUrl"],["SHIPPING_SERVICE_URL","shippingServiceUrl"],["NOTIFICATION_SERVICE_URL","notificationServiceUrl"]])("validates %s and preserves override", (variable, field) => {
    expect(loadConfig({ ...env, [variable]: "https://service.test" })).toHaveProperty(field, "https://service.test");
    for (const value of ["invalid", "postgresql://localhost/db", "", "https://service.test/base", "https://user:secret@service.test", "https://service.test?target=other", "https://service.test#fragment"]) {
      expect(() => loadConfig({ ...env, [variable]: value })).toThrow(`Configuration variable ${variable} must`);
    }
  });

  it("preserves JWKS fallback and applies explicit auth URL to both consumers", () => {
    expect(loadConfig(env).jwksAuthServiceUrl).toBe("http://auth-service:3001");
    const config = loadConfig({ ...env, AUTH_SERVICE_URL: "https://auth.test" });
    expect(config.authServiceUrl).toBe("https://auth.test");
    expect(config.jwksAuthServiceUrl).toBe(config.authServiceUrl);
  });
});

describe("gateway boundary configuration", () => {
  it.each(["GATEWAY_BODY_LIMIT_BYTES", "GATEWAY_RATE_WINDOW_MS", "GATEWAY_RATE_LIMIT", "GATEWAY_AUTH_RATE_LIMIT", "GATEWAY_REFRESH_RATE_LIMIT"])("validates %s", (name) => {
    for (const value of ["", "0", "-1", "NaN", "1.5", "99999999999999"]) {
      expect(() => loadConfig({ ...env, [name]: value })).toThrow(ConfigurationError);
    }
    expect(() => loadConfig({ ...env, [name]: "100" })).not.toThrow();
  });

  it("requires explicit production origins and upstreams", () => {
    expect(() => loadConfig({ ...env, NODE_ENV: "production" })).toThrow(ConfigurationError);
    expect(() => loadConfig({ ...env, NODE_ENV: "production", CORS_ALLOWED_ORIGINS: "https://shop.test" })).toThrow("AUTH_SERVICE_URL");
    const production = { ...env, NODE_ENV: "production", CORS_ALLOWED_ORIGINS: "https://shop.test" };
    const urls = Object.fromEntries(["AUTH", "CATALOG", "INVENTORY", "ORDER", "CART", "PAYMENT", "SHIPPING", "NOTIFICATION"].map((service) => [`${service}_SERVICE_URL`, `http://${service.toLowerCase()}:3000`]));
    expect(loadConfig({ ...production, ...urls }).corsOrigins).toEqual(["https://shop.test"]);
  });

  it.each(["*", "null", "https://shop.test/path", "https://shop.test@evil.test#x"])("rejects invalid CORS origin %s", (CORS_ALLOWED_ORIGINS) => {
    expect(() => loadConfig({ ...env, CORS_ALLOWED_ORIGINS })).toThrow(ConfigurationError);
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
