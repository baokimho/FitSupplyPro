import { describe, expect, it } from "vitest";
import { ConfigurationError, optionalEnvString, parseNodeEnv, parsePort, parseUrl, requireEnvString } from "./env.js";

describe("configuration strings", () => {
  it.each(["secret", "  secret  ", "line1\nline2"])("preserves %j", (value) => {
    expect(requireEnvString("GATEWAY_SECRET", value)).toBe(value);
    expect(optionalEnvString("GATEWAY_SECRET", value)).toBe(value);
  });
  it.each([undefined, "", " \t\n"])("rejects required %j", (value) => {
    expect(() => requireEnvString("GATEWAY_SECRET", value)).toThrow(ConfigurationError);
    expect(() => requireEnvString("GATEWAY_SECRET", value)).toThrow("GATEWAY_SECRET");
  });
  it("accepts absent optional string", () => {
    expect(optionalEnvString("OPTIONAL", undefined)).toBeUndefined();
  });
  it.each(["", " \t\n"])("rejects blank optional %j", (value) => {
    expect(() => optionalEnvString("OPTIONAL", value)).toThrow(ConfigurationError);
  });
});

describe("ports", () => {
  it.each([["1", 1], ["3000", 3000], ["65535", 65535]])("parses %s", (value, expected) => {
    expect(parsePort("PORT", value)).toBe(expected);
  });
  it.each([undefined, "", " ", " 3000 ", "0", "-1", "65536", "3.5", "NaN", "abc", "1e3", "0x10", "+3000"])("rejects %j", (value) => {
    expect(() => parsePort("PORT", value)).toThrow(ConfigurationError);
  });
  it("uses explicit default only for absent value", () => {
    expect(parsePort("PORT", undefined, 3000)).toBe(3000);
    expect(parsePort("PORT", "4000", 3000)).toBe(4000);
    expect(() => parsePort("PORT", "", 3000)).toThrow(ConfigurationError);
  });
  it.each([0, -1, 65536, 1.5, NaN, Infinity])("validates default %j", (value) => {
    expect(() => parsePort("PORT", undefined, value)).toThrow(ConfigurationError);
  });
});

describe("service URLs", () => {
  it.each(["http://order-service:3003", "https://example.com/path?x=1#fragment", "HTTP://EXAMPLE.COM", "http://user:password@example.com"])("preserves %s", (value) => {
    expect(parseUrl("ORDER_SERVICE_URL", value)).toBe(value);
  });
  it.each([undefined, "", " ", "order-service:3003", "example.com", "ftp://example.com", "http://", "http:example.com", "http:///example.com", "http://example.com:99999", " http://example.com", "http://exa mple.com", "http://example.com\\path"])("rejects %j", (value) => {
    expect(() => parseUrl("ORDER_SERVICE_URL", value)).toThrow(ConfigurationError);
  });
});

describe("NODE_ENV", () => {
  it.each(["development", "test", "production"])("accepts %s", (value) => {
    expect(parseNodeEnv("NODE_ENV", value)).toBe(value);
  });
  it.each([undefined, "", " ", "staging", "Production", " development "])("rejects %j", (value) => {
    expect(() => parseNodeEnv("NODE_ENV", value)).toThrow(ConfigurationError);
  });
  it("uses explicit default only for absent value", () => {
    expect(parseNodeEnv("NODE_ENV", undefined, "development")).toBe("development");
    expect(parseNodeEnv("NODE_ENV", "production", "development")).toBe("production");
    expect(() => parseNodeEnv("NODE_ENV", "", "development")).toThrow(ConfigurationError);
  });
});

describe("configuration diagnostics", () => {
  it.each([
    () => parseUrl("DATABASE_URL", "http://user:secret-password@host:bad"),
    () => parseUrl("JWT_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----secret-key"),
    () => parsePort("GATEWAY_SECRET", "secret-token"),
    () => parseNodeEnv("NODE_ENV", "secret-environment"),
  ])("reports rule and variable without values or native cause", (parse) => {
    let caught: unknown;
    try { parse(); } catch (error) { caught = error; }
    expect(caught).toBeInstanceOf(ConfigurationError);
    if (!(caught instanceof ConfigurationError)) throw new Error("Expected ConfigurationError");
    expect(caught.name).toBe("ConfigurationError");
    expect(caught.message).toContain(caught.variable);
    expect(caught.message).toContain(caught.reason);
    expect(caught).not.toHaveProperty("cause");
    expect(`${caught.stack} ${JSON.stringify(caught)}`).not.toMatch(/secret-password|secret-key|secret-token|secret-environment|user:|BEGIN PRIVATE KEY/);
  });
});
