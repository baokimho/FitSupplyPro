import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { correlationMiddleware } from "@shared/utils";
import { healthRouter, readiness } from "./health.js";

const mocks = vi.hoisted(() => ({ query: vi.fn(), warn: vi.fn() }));
vi.mock("./logger.js", () => ({ logger: { warn: mocks.warn } }));
vi.mock("./config/db.js", () => ({ default: { $queryRaw: mocks.query } }));

const app = express();
app.use(correlationMiddleware("service"), healthRouter);

describe("payment probes", () => {
  beforeEach(() => { readiness.stopping = false; vi.clearAllMocks(); mocks.query.mockResolvedValue([{ value: 1 }]); });
  it("health is public and dependency-free; readiness checks Payment DB only", async () => {
    await request(app).get("/health").expect(200, { status: "ok", service: "payment-service" });
    expect(mocks.query).not.toHaveBeenCalled();
    await request(app).get("/ready").expect(200, { status: "ready", service: "payment-service" });
    expect(mocks.query).toHaveBeenCalledExactlyOnceWith(["SELECT 1"]);
  });
  it("DB failure and shutdown return safe not-ready responses", async () => {
    mocks.query.mockRejectedValue(new Error("private-db-error"));
    const response = await request(app).get("/ready").expect(503);
    expect(response.body).toEqual({ status: "not_ready", service: "payment-service" });
    expect(mocks.warn).toHaveBeenCalledWith(expect.objectContaining({ requestId: response.headers["x-request-id"] }), "readiness check failed");
    readiness.stopping = true;
    await request(app).get("/ready").expect(503);
    await request(app).get("/health").expect(200);
  });
});
