import { createServer, request as httpRequest, type Server } from "node:http";
import { EventEmitter, once } from "node:events";
import request from "supertest";
import { expect, it, vi } from "vitest";
import { createLogger, installShutdown } from "@shared/utils";

const state = vi.hoisted(() => ({ target: "" }));
vi.mock("./logger.js", () => ({ logger: createLogger({ service: "api-gateway", environment: "test", level: "silent" }) }));
vi.mock("./config/index.js", async () => {
  const { loadConfig } = await import("./config/env.js");
  return { config: loadConfig({ GATEWAY_SECRET: "gateway-test-secret", NODE_ENV: "test", AUTH_SERVICE_URL: state.target }) };
});

const listen = async (server: Server) => {
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing test address");
  return address.port;
};

// Isolated file: real shutdown permanently aborts this process's dependency work.
it("SIGTERM drains an accepted proxy response before shutdown completes", async () => {
  let entered!: () => void; let release!: () => void;
  const started = new Promise<void>((resolve) => { entered = resolve; });
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  const upstream = createServer(async (_req, res) => { entered(); await barrier; res.end("completed"); });
  state.target = `http://127.0.0.1:${await listen(upstream)}`;
  const { createApp } = await import("./app.js");
  const { readiness } = await import("./health.js");
  const { logger } = await import("./logger.js");
  const app = createApp(); const server = createServer(app); const port = await listen(server);
  const exit = vi.fn();
  const signals = new EventEmitter() as unknown as Pick<NodeJS.Process, "on" | "off">;
  const lifecycle = installShutdown({ server, state: readiness, logger, signals, exit });
  try {
    const response = new Promise<string>((resolve, reject) => {
      const call = httpRequest({ host: "127.0.0.1", port, path: "/auth/delayed", agent: false }, (res) => {
        let body = ""; res.on("data", (chunk) => { body += chunk; }); res.on("end", () => resolve(body));
      }); call.on("error", reject); call.end();
    });
    await started;
    const shutdown = lifecycle.shutdown("SIGTERM");
    expect(readiness.stopping).toBe(true); expect(exit).not.toHaveBeenCalled();
    await request(app).get("/ready").expect(503);
    await request(app).get("/auth/echo").expect(503);
    release(); expect(await response).toBe("completed");
    await shutdown; expect(exit).toHaveBeenCalledWith(0);
  } finally {
    release(); lifecycle.dispose(); readiness.stopping = false;
    server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve()));
    upstream.closeAllConnections(); await new Promise<void>((resolve) => upstream.close(() => resolve()));
  }
});
