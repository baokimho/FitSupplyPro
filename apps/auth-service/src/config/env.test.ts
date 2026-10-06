import { describe, expect, it } from "vitest";
import { ConfigurationError } from "@shared/utils";
import { loadConfig } from "./env.js";

const env = { GATEWAY_SECRET: "test-secret", DATABASE_URL: "postgresql://test:test@localhost/test_db" };

describe("auth-service config", () => {
  it("preserves defaults and database/secret values", () => {
    expect(loadConfig(env)).toMatchObject({
      nodeEnv: "development", port: 3001, gatewaySecret: env.GATEWAY_SECRET,
      databaseUrl: env.DATABASE_URL,

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

  it("allows file key fallback and preserves supplied key material", () => {
    expect(loadConfig(env).jwtPrivateKeyBase64).toBeUndefined();
    expect(loadConfig(env).jwtPublicKeyBase64).toBeUndefined();
    expect(loadConfig({ ...env, JWT_PRIVATE_KEY_BASE64: "private-key", JWT_PUBLIC_KEY_BASE64: "public-key" })).toMatchObject({ jwtPrivateKeyBase64: "private-key", jwtPublicKeyBase64: "public-key" });
  });

  it.each(["JWT_PRIVATE_KEY_BASE64", "JWT_PUBLIC_KEY_BASE64"])("rejects explicitly blank %s", (variable) => {
    expect(() => loadConfig({ ...env, [variable]: "" })).toThrow(ConfigurationError);
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
