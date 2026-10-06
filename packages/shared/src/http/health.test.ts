import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createHealthRouter } from "./health.js";
import { correlationMiddleware } from "./correlation.js";
import { createLogger } from "../logging/logger.js";

function fixture(checkReady?: () => Promise<unknown>) {
  const state = { stopping: false };
  const lines: string[] = [];
  const logger = createLogger({ service: "test-service", environment: "test" }, { write(line: string) { lines.push(line); } });
  const app = express();
  app.use(correlationMiddleware("service"));
  app.use(createHealthRouter({ service: "test-service", logger, isReady: () => !state.stopping, checkReady }));
  return { app, state, lines };
}

describe("health/readiness semantics", () => {
  it("liveness never checks dependencies; readiness checks only configured dependency", async () => {
    const check = vi.fn().mockResolvedValue(undefined);
    const { app } = fixture(check);
    expect((await request(app).get("/health").expect(200)).body).toEqual({ status: "ok", service: "test-service" });
    expect(check).not.toHaveBeenCalled();
    expect((await request(app).get("/ready").expect(200)).body).toEqual({ status: "ready", service: "test-service" });
    expect(check).toHaveBeenCalledTimes(1);
  });

  it("gateway-style readiness requires no downstream fetches", async () => {
    const { app } = fixture();
    await request(app).get("/ready").expect(200);
  });

  it("dependency failure is safe 503 with correlated, redacted warning", async () => {
    const { app, lines } = fixture(async () => { throw new Error("postgresql://user:private-password@db/private"); });
    const response = await request(app).get("/ready?token=query-secret").set("Authorization", "Bearer header-secret").expect(503);
    expect(response.body).toEqual({ status: "not_ready", service: "test-service" });
    expect(JSON.parse(lines[0])).toMatchObject({ level: 40, operation: "readiness", requestId: response.headers["x-request-id"], traceId: expect.any(String), err: expect.any(Object) });
    for (const secret of ["private-password", "query-secret", "header-secret"]) expect(lines.join("")).not.toContain(secret);
    await request(app).get("/health").expect(200);
  });

  it("stopping skips checks and remains live", async () => {
    const check = vi.fn().mockResolvedValue(undefined);
    const { app, state } = fixture(check);
    state.stopping = true;
    await request(app).get("/ready").expect(503);
    await request(app).get("/health").expect(200);
    expect(check).not.toHaveBeenCalled();
  });

  it("cannot report ready if shutdown begins during dependency check", async () => {
    let finish!: () => void, started!: () => void;
    const checking = new Promise<void>((resolve) => { started = resolve; });
    const { app, state } = fixture(() => { started(); return new Promise<void>((resolve) => { finish = resolve; }); });
    const response = request(app).get("/ready").then((result) => result);
    await checking;
    state.stopping = true;
    finish();
    expect((await response).status).toBe(503);
  });

  it("bounds hung readiness probes without leaking diagnostics", async () => {
    const { app, lines } = fixture(() => new Promise(() => {}));
    const response = await request(app).get("/ready").expect(503);
    expect(response.body).toEqual({ status: "not_ready", service: "test-service" });
    expect(JSON.parse(lines[0]).err.message).toBe("Readiness check timed out");
  });
});
