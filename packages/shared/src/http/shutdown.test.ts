import { EventEmitter } from "node:events";
import { createServer, get } from "node:http";
import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { installShutdown, shutdownGuard, SHUTDOWN_TIMEOUT_MS } from "./shutdown.js";
import { createHealthRouter } from "./health.js";
import { createLogger } from "../logging/logger.js";

afterEach(() => vi.useRealTimers());

function fixture() {
  const state = { stopping: false };
  const signals = new EventEmitter();
  const lines: string[] = [];
  const logger = createLogger({ service: "test", environment: "test" }, { write(line: string) { lines.push(line); } });
  let closed!: (err?: Error) => void;
  const server = { close: vi.fn((callback?: (err?: Error) => void) => { closed = callback!; return server; }), closeAllConnections: vi.fn() };
  const cleanup = vi.fn().mockResolvedValue(undefined);
  const stopWork = vi.fn();
  const exit = vi.fn();
  const lifecycle = installShutdown({ server: server as unknown as import("node:http").Server, logger, state, signals, exit, cleanup: [cleanup], stopWork });
  return { ...lifecycle, state, signals, server, cleanup, stopWork, exit, logger, lines, drained: (err?: Error) => closed(err) };
}

describe("graceful shutdown", () => {
  it.each(["SIGTERM", "SIGINT"] as const)("handles %s, flips readiness, stops background work, drains before cleanup", async (signal) => {
    const f = fixture();
    f.signals.emit(signal);
    const pending = f.shutdown(signal);
    expect(f.state.stopping).toBe(true);
    expect(f.stopWork).toHaveBeenCalledTimes(1);
    expect(f.server.close).toHaveBeenCalledTimes(1);
    expect(f.cleanup).not.toHaveBeenCalled();
    expect(f.exit).not.toHaveBeenCalled();
    f.drained();
    await pending;
    expect(f.cleanup).toHaveBeenCalledTimes(1);
    expect(f.exit).toHaveBeenCalledExactlyOnceWith(0);
    expect(f.signals.listenerCount(signal)).toBe(0);
    expect(f.lines.map((line) => JSON.parse(line).msg)).toEqual(["shutdown initiated", "server stopped accepting requests", "resources closed", "shutdown completed"]);
    expect(f.lines.every((line) => JSON.parse(line).signal === signal)).toBe(true);
  });

  it("repeated/mixed signals share one shutdown and cleanup", async () => {
    const f = fixture();
    const first = f.shutdown("SIGTERM");
    expect(f.shutdown("SIGINT")).toBe(first);
    f.signals.emit("SIGTERM");
    expect(f.server.close).toHaveBeenCalledTimes(1);
    f.drained();
    await first;
    expect(f.cleanup).toHaveBeenCalledTimes(1);
    expect(f.shutdown("SIGTERM")).toBe(first);
  });

  it("bounds a hung HTTP drain and avoids premature DB cleanup", async () => {
    vi.useFakeTimers();
    const f = fixture();
    const pending = f.shutdown("SIGTERM");
    await vi.advanceTimersByTimeAsync(SHUTDOWN_TIMEOUT_MS);
    await pending;
    expect(f.server.closeAllConnections).toHaveBeenCalledTimes(1);
    expect(f.cleanup).not.toHaveBeenCalled();
    expect(f.exit).toHaveBeenCalledExactlyOnceWith(1);
    f.drained();
    await Promise.resolve();
    expect(f.cleanup).not.toHaveBeenCalled();
    expect(f.lines.some((line) => JSON.parse(line).msg === "shutdown timed out")).toBe(true);
  });

  it("also bounds hung resource cleanup", async () => {
    vi.useFakeTimers();
    const f = fixture();
    f.cleanup.mockReturnValue(new Promise(() => {}));
    const pending = f.shutdown("SIGINT");
    f.drained();
    await vi.advanceTimersByTimeAsync(SHUTDOWN_TIMEOUT_MS);
    await pending;
    expect(f.exit).toHaveBeenCalledExactlyOnceWith(1);
  });

  it.each(["close", "cleanup"])("fails non-zero if %s fails", async (stage) => {
    const f = fixture();
    if (stage === "cleanup") f.cleanup.mockRejectedValue(new Error("cleanup failure"));
    const pending = f.shutdown("SIGTERM");
    f.drained(stage === "close" ? new Error("server failure") : undefined);
    await pending;
    expect(f.exit).toHaveBeenCalledExactlyOnceWith(1);
    expect(f.lines.some((line) => JSON.parse(line).msg === "shutdown failed")).toBe(true);
  });

  it("rejects new business work during drain, stays live, and readiness is 503", async () => {
    const f = fixture();
    const app = express();
    const business = vi.fn((_req: express.Request, res: express.Response) => res.sendStatus(200));
    app.use(createHealthRouter({ service: "test", logger: f.logger, isReady: () => !f.state.stopping }));
    app.use(shutdownGuard(f.state));
    app.get("/work", business);
    await request(app).get("/work").expect(200);
    const pending = f.shutdown("SIGTERM");
    await request(app).get("/ready").expect(503);
    await request(app).get("/health").expect(200);
    const response = await request(app).get("/work").expect(503);
    expect(response.headers.connection).toBe("close");
    expect(response.body).toEqual({ error: { code: "SERVICE_UNAVAILABLE", message: "Service shutting down" } });
    expect(business).toHaveBeenCalledTimes(1);
    f.drained();
    await pending;
  });

  it("real HTTP server drains active response before cleanup and refuses new connections", async () => {
    let entered!: () => void, finish!: () => void;
    const active = new Promise<void>((resolve) => { entered = resolve; });
    const server = createServer((_req, res) => { entered(); finish = () => res.end("done"); });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing test server address");
    const url = `http://127.0.0.1:${address.port}/work`;
    const response = new Promise<string>((resolve, reject) => get(url, { agent: false }, (res) => { let body = ""; res.on("data", (data: Buffer) => { body += data.toString(); }); res.on("end", () => resolve(body)); }).on("error", reject));
    await active;
    const f = fixture();
    f.dispose();
    const lifecycle = installShutdown({ server, state: f.state, logger: f.logger, cleanup: [f.cleanup], signals: f.signals, exit: f.exit });
    const pending = lifecycle.shutdown("SIGTERM");
    expect(server.listening).toBe(false);
    expect(f.cleanup).not.toHaveBeenCalled();
    await expect(new Promise((resolve, reject) => get(url, { agent: false }, resolve).on("error", reject))).rejects.toThrow();
    finish();
    expect(await response).toBe("done");
    await pending;
    expect(f.cleanup).toHaveBeenCalledTimes(1);
    expect(f.exit).toHaveBeenCalledExactlyOnceWith(0);
  });
});
