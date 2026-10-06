import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { createLogger, parseLogLevel, type LogLevel } from "./logger.js";
import { httpLogger } from "./http.js";
import { ConfigurationError } from "../config/env.js";

function capture(level?: LogLevel) {
  const lines: string[] = [];
  const logger = createLogger({ service: "test-service", environment: "test", level }, {
    write(line: string) { lines.push(line); },
  });
  return { logger, lines, entries: () => lines.map((line) => JSON.parse(line)) };
}

describe("structured logging", () => {
  it("emits JSON with service/environment and child context", () => {
    const { logger, entries } = capture();
    logger.child({ operation: "reserve" }).info({ quantity: 2 }, "reserved");
    expect(entries()).toEqual([expect.objectContaining({ service: "test-service", environment: "test", operation: "reserve", quantity: 2, level: 30, msg: "reserved" })]);
  });

  it("keeps instances independent and filters by configured level", () => {
    const info = capture();
    const debug = capture("debug");
    info.logger.debug("hidden");
    debug.logger.debug("visible");
    info.logger.info("normal");
    expect(info.entries().map((entry) => entry.msg)).toEqual(["normal"]);
    expect(debug.entries()[0]).toMatchObject({ level: 20, msg: "visible" });
    const silent = capture("silent");
    silent.logger.fatal("hidden");
    expect(silent.lines).toEqual([]);
  });

  it("serializes error diagnostics and omits attached sensitive payloads", () => {
    const { logger, entries } = capture();
    const error = Object.assign(new Error("operation failed"), { body: { password: "attached-secret" } });
    logger.error({ err: error }, "failure");
    expect(entries()[0].err).toMatchObject({ type: "Error", message: "operation failed", stack: expect.stringContaining("operation failed") });
    expect(entries()[0].err).not.toHaveProperty("body");
  });

  it("redacts credentials embedded in error messages and cause stacks", () => {
    const { logger, lines } = capture();
    const error = new Error("failed postgresql://user:db-secret@localhost/db Bearer jwt-secret -----BEGIN PRIVATE KEY-----key-secret-----END PRIVATE KEY-----");
    Object.assign(error, { cause: new Error("https://user:http-secret@service.test/path") });
    logger.error({ err: error }, "failure");
    for (const secret of ["db-secret", "jwt-secret", "key-secret", "http-secret"]) expect(lines.join("")).not.toContain(secret);
    expect(lines.join("")).toContain("[Redacted");
  });

  it("redacts known secret fields at root, context, headers, body, and child bindings", () => {
    const { logger, entries, lines } = capture();
    const fields = { password: "pw-secret", token: "jwt-secret", accessToken: "access-secret", refreshToken: "refresh-secret", databaseUrl: "db-secret", GATEWAY_SECRET: "internal-credential-value", JWT_PRIVATE_KEY_BASE64: "key-secret", jwtPublicKeyBase64: "public-secret", authorization: "auth-secret", cookie: "cookie-secret" };
    logger.child({ gatewaySecret: "binding-secret" }).info({ ...fields, config: fields, req: { headers: { Authorization: "header-secret", "x-gateway-secret": "internal-secret", "set-cookie": "response-secret" }, body: fields } }, "safe event");
    for (const value of [...Object.values(fields), "binding-secret", "header-secret", "internal-secret", "response-secret"]) expect(lines.join("")).not.toContain(value);
    expect(entries()[0]).toMatchObject({ password: "[Redacted]", gatewaySecret: "[Redacted]", req: { body: { token: "[Redacted]" } } });
    expect(fields.password).toBe("pw-secret");
  });

  it.each(["fatal", "error", "warn", "info", "debug", "trace", "silent"])("accepts level %s", (level) => {
    expect(parseLogLevel("LOG_LEVEL", level)).toBe(level);
  });

  it("defaults to info and rejects invalid levels without leaking input", () => {
    expect(parseLogLevel("LOG_LEVEL", undefined)).toBe("info");
    for (const value of ["", " ", "INFO", "unknown-secret"]) {
      expect(() => parseLogLevel("LOG_LEVEL", value)).toThrow(ConfigurationError);
      expect(() => parseLogLevel("LOG_LEVEL", value)).toThrow("Configuration variable LOG_LEVEL must be fatal, error, warn, info, debug, trace, or silent");
    }
  });

  it("logs one completion with original mounted path, status, and elapsed time; excludes secrets", async () => {
    const { logger, entries, lines } = capture();
    const app = express();
    app.use(httpLogger(logger));
    app.use(express.json());
    const router = express.Router();
    router.post("/login", (_req, res) => res.status(401).json({ token: "response-secret" }));
    app.use("/auth", router);
    await request(app).post("/auth/login?token=query-secret").set("Authorization", "Bearer auth-secret").set("Cookie", "cookie-secret").send({ password: "body-secret" }).expect(401);
    expect(entries()).toEqual([expect.objectContaining({ service: "test-service", method: "POST", path: "/auth/login", statusCode: 401, durationMs: expect.any(Number), msg: "request completed" })]);
    expect(entries()[0].durationMs).toBeGreaterThanOrEqual(0);
    for (const secret of ["query-secret", "auth-secret", "cookie-secret", "body-secret", "response-secret"]) expect(lines.join("")).not.toContain(secret);
  });
});
