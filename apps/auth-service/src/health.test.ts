import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { correlationMiddleware } from "@shared/utils";
import { healthRouter, readiness } from "./health.js";

const mocks = vi.hoisted(() => ({ query: vi.fn(), warn: vi.fn() }));
vi.mock("./logger.js", () => ({ logger: { warn: mocks.warn } }));
vi.mock("./config/db.js", () => ({ default: { $queryRaw: mocks.query } }));

function app() {
  const instance = express();
  instance.use(correlationMiddleware("service"), healthRouter);
  return instance;
}

describe("auth-service probes", () => {
  beforeEach(() => { readiness.stopping = false; vi.clearAllMocks(); mocks.query.mockResolvedValue([{ value: 1 }]); });

  it("health is dependency-free; ready checks database only", async () => {
    await request(app()).get("/health").expect(200, { status: "ok", service: "auth-service" });
    expect(mocks.query).not.toHaveBeenCalled();
    await request(app()).get("/ready").expect(200, { status: "ready", service: "auth-service" });
    expect(mocks.query).toHaveBeenCalledExactlyOnceWith(["SELECT 1"]);
  });

  it("stopping makes ready 503 but health stays 200", async () => {
    readiness.stopping = true;
    await request(app()).get("/ready").expect(503, { status: "not_ready", service: "auth-service" });
    await request(app()).get("/health").expect(200);
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("database failure returns safe 503 with correlation context", async () => {
    mocks.query.mockRejectedValue(new Error("private-db-diagnostics"));
    const response = await request(app()).get("/ready").expect(503);
    expect(response.body).toEqual({ status: "not_ready", service: "auth-service" });
    expect(mocks.warn).toHaveBeenCalledWith(expect.objectContaining({ operation: "readiness", requestId: response.headers["x-request-id"], traceId: expect.any(String), err: expect.any(Error) }), "readiness check failed");
  });
});
