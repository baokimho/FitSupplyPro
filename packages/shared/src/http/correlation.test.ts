import express, { type Request, type Response } from "express";
import request from "supertest";
import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { correlationMiddleware, correlationHeaders, getCorrelation, validCorrelationId } from "./correlation.js";
import { createLogger } from "../logging/logger.js";
import { httpLogger } from "../logging/http.js";
import { createErrorHandler } from "../middleware/error.handler.js";

describe("request correlation", () => {
  it.each([undefined, "", " ", "malformed", "a".repeat(5000), "id\r\ninjected", [randomUUID(), randomUUID()]])("rejects unsafe ID %j", (id) => {
    expect(validCorrelationId(id)).toBe(false);
    const req = { headers: { "x-request-id": id, "x-trace-id": id } } as unknown as Request;
    const res = { setHeader: vi.fn() };
    correlationMiddleware("service")(req, res as unknown as Response, () => {
      expect(validCorrelationId(getCorrelation()?.requestId)).toBe(true);
      expect(validCorrelationId(getCorrelation()?.traceId)).toBe(true);
    });
    expect(getCorrelation()).toBeUndefined();
  });

  it("gateway preserves valid request ID, owns trace ID, and returns only request ID", async () => {
    const app = express();
    app.use(correlationMiddleware("gateway"));
    app.get("/", (req, res) => res.json(req.correlation));
    const requestId = randomUUID(), externalTrace = randomUUID();
    const response = await request(app).get("/").set("x-request-id", requestId).set("x-trace-id", externalTrace);
    expect(response.body.requestId).toBe(requestId);
    expect(validCorrelationId(response.body.traceId)).toBe(true);
    expect(response.body.traceId).not.toBe(externalTrace);
    expect(response.headers["x-request-id"]).toBe(requestId);
    expect(response.headers).not.toHaveProperty("x-trace-id");
  });

  it("internal service preserves trace and outgoing calls receive distinct hop IDs", async () => {
    const app = express();
    app.use(correlationMiddleware("service"));
    app.get("/", (req, res) => res.json({ ...req.correlation, outgoing: [correlationHeaders(), correlationHeaders()] }));
    const traceId = randomUUID();
    const response = await request(app).get("/").set("x-trace-id", traceId);
    expect(response.body.traceId).toBe(traceId);
    const ids = response.body.outgoing.map((headers: Record<string, string>) => {
      expect(headers["x-trace-id"]).toBe(traceId);
      expect(validCorrelationId(headers["x-request-id"])).toBe(true);
      return headers["x-request-id"];
    });
    expect(new Set([...ids, response.body.requestId]).size).toBe(3);
    expect(correlationHeaders()).toEqual({});
  });

  it("isolates concurrent async requests, child logs, completion logs, and errors without secrets", async () => {
    const lines: string[] = [];
    const logger = createLogger({ service: "test", environment: "test" }, { write(line: string) { lines.push(line); } });
    const app = express();
    app.use(correlationMiddleware("service"), httpLogger(logger), express.json());
    app.post("/:operation", async (req, _res, next) => {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
      logger.child({ operation: req.params.operation }).info("operation");
      next(Object.assign(new Error("operation failed"), { body: req.body }));
    });
    app.use(createErrorHandler(logger));
    const ids = Array.from({ length: 12 }, () => ({ requestId: randomUUID(), traceId: randomUUID() }));
    await Promise.all(ids.map((id, i) => request(app).post(`/operation-${i}?token=query-secret`).set("x-request-id", id.requestId).set("x-trace-id", id.traceId).set("Authorization", "Bearer header-secret").send({ password: "body-secret" }).expect(500)));
    const entries = lines.map((line) => JSON.parse(line));
    ids.forEach((id, i) => {
      expect(entries.filter((entry) => entry.requestId === id.requestId)).toHaveLength(3);
      expect(entries.filter((entry) => entry.requestId === id.requestId).every((entry) => entry.traceId === id.traceId)).toBe(true);
      expect(entries.find((entry) => entry.operation === `operation-${i}`)).toMatchObject(id);
    });
    for (const secret of ["query-secret", "header-secret", "body-secret"]) expect(lines.join("")).not.toContain(secret);
    expect(getCorrelation()).toBeUndefined();
    logger.info("outside request");
    expect(JSON.parse(lines[lines.length - 1])).not.toHaveProperty("traceId");
  });
});
