import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { correlationMiddleware } from "@shared/utils";
import { healthRouter, readiness } from "./health.js";

const mocks = vi.hoisted(() => ({ query: vi.fn(), warn: vi.fn() }));
vi.mock("./logger.js", () => ({ logger: { warn: mocks.warn } }));

function app() {
  const instance = express();
  instance.use(correlationMiddleware("service"), healthRouter);
  return instance;
}

describe("api-gateway probes", () => {
  beforeEach(() => { readiness.stopping = false; vi.clearAllMocks(); mocks.query.mockResolvedValue([{ value: 1 }]); });

  it("health is dependency-free; ready is local only", async () => {
    await request(app()).get("/health").expect(200, { status: "ok", service: "api-gateway" });
    expect(mocks.query).not.toHaveBeenCalled();
    await request(app()).get("/ready").expect(200, { status: "ready", service: "api-gateway" });
    expect(mocks.query).not.toHaveBeenCalled();
  });

  it("stopping makes ready 503 but health stays 200", async () => {
    readiness.stopping = true;
    await request(app()).get("/ready").expect(503, { status: "not_ready", service: "api-gateway" });
    await request(app()).get("/health").expect(200);
    expect(mocks.query).not.toHaveBeenCalled();
  });
});
