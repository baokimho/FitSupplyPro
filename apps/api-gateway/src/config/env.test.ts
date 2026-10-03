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
    expect(loadConfig({ ...env, PORT: "4100", NODE_ENV: "production" })).toMatchObject({ port: 4100, nodeEnv: "production" });
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
    expect(loadConfig({ ...env, [variable]: "https://service.test/base" })).toHaveProperty(field, "https://service.test/base");
    for (const value of ["invalid", "postgresql://localhost/db", ""]) {
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
