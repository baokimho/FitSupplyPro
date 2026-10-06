import express, { type Request, type Response } from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { BadRequestError, ServiceUnavailableError } from "../errors/httpErrors.js";
import { createLogger } from "../logging/logger.js";
import { httpLogger } from "../logging/http.js";
import { createErrorHandler } from "./error.handler.js";

function fixture(level: "info" | "debug" = "info") {
  const lines: string[] = [];
  const logger = createLogger({ service: "auth-service", environment: "test", level }, { write(line: string) { lines.push(line); } });
  const app = express();
  app.use(httpLogger(logger));
  return { app, logger, lines, entries: () => lines.map((line) => JSON.parse(line)) };
}

describe("service structured errors", () => {
  it("logs unexpected error once with safe HTTP context and preserves safe 500", async () => {
    const { app, logger, entries, lines } = fixture();
    const error = Object.assign(new Error("database failed"), { password: "attached-secret" });
    app.get("/failure", (_req, _res, next) => next(error));
    app.use(createErrorHandler(logger));
    const response = await request(app).get("/failure?token=query-secret").set("Authorization", "Bearer auth-secret");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
    expect(entries().filter((entry) => entry.msg === "request failed")).toEqual([expect.objectContaining({ service: "auth-service", level: 50, method: "GET", path: "/failure", statusCode: 500, code: "INTERNAL_ERROR", err: expect.objectContaining({ message: "database failed", stack: expect.any(String) }) })]);
    expect(entries().filter((entry) => entry.msg === "request completed")).toHaveLength(1);
    for (const secret of ["attached-secret", "query-secret", "auth-secret"]) expect(lines.join("")).not.toContain(secret);
  });

  it("keeps expected 4xx quiet at info; debug omits original error/cause", async () => {
    for (const level of ["info", "debug"] as const) {
      const { app, logger, entries, lines } = fixture(level);
      app.get("/", (_req, _res, next) => next(new BadRequestError("Invalid input", { field: "quantity" }, undefined, new Error("private-cause"))));
      app.use(createErrorHandler(logger));
      const response = await request(app).get("/");
      expect(response.body).toEqual({ error: { code: "BAD_REQUEST", message: "Invalid input", details: { field: "quantity" } } });
      expect(entries().some((entry) => entry.level >= 40)).toBe(false);
      expect(entries().filter((entry) => entry.msg === "request rejected")).toHaveLength(level === "debug" ? 1 : 0);
      expect(lines.join("")).not.toContain("private-cause");
    }
  });

  it("logs 503 failures without returning internal cause/stack", async () => {
    const { app, logger, entries } = fixture();
    app.get("/", (_req, _res, next) => next(new ServiceUnavailableError("Service unavailable", undefined, undefined, new Error("internal failure"))));
    app.use(createErrorHandler(logger));
    const response = await request(app).get("/");
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: { code: "SERVICE_UNAVAILABLE", message: "Service unavailable" } });
    expect(entries()[0]).toMatchObject({ level: 50, statusCode: 503, err: { message: expect.stringContaining("internal failure") } });
  });

  it("retains safe response if logging throws", () => {
    const { logger } = fixture();
    vi.spyOn(logger, "error").mockImplementation(() => { throw new Error("logger failed"); });
    const res = { status: vi.fn(), json: vi.fn() };
    res.status.mockReturnValue(res);
    const handler = createErrorHandler(logger);
    expect(() => handler(new Error("failure"), {} as Request, res as unknown as Response, vi.fn())).not.toThrow();
    expect(res.json).toHaveBeenCalledWith({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
  });
});
