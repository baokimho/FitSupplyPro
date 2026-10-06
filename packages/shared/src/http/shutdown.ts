import type { Server } from "node:http";
import type { RequestHandler } from "express";
import type { Logger } from "../logging/logger.js";

export const SHUTDOWN_TIMEOUT_MS = 8000;
type ReadinessState = { stopping: boolean };

export function shutdownGuard(state: ReadinessState): RequestHandler {
  return (_req, res, next) => {
    if (!state.stopping) return next();
    res.setHeader("Connection", "close");
    res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "Service shutting down" } });
  };
}

export function installShutdown(options: {
  server: Pick<Server, "close" | "closeAllConnections">;
  logger: Logger;
  state: ReadinessState;
  cleanup?: Array<() => void | Promise<unknown>>;
  stopWork?: () => void;
  signals?: Pick<NodeJS.Process, "on" | "off">;
  exit?: (code: number) => void;
}) {
  const signals = options.signals ?? process;
  const exit = options.exit ?? ((code: number) => {
    if (code === 0) process.exitCode = 0;
    else process.exit(code);
  });
  let pending: Promise<void> | undefined;
  const handlers = { SIGTERM: () => { void shutdown("SIGTERM"); }, SIGINT: () => { void shutdown("SIGINT"); } };
  const dispose = () => {
    signals.off("SIGTERM", handlers.SIGTERM);
    signals.off("SIGINT", handlers.SIGINT);
  };

  function shutdown(signal: "SIGTERM" | "SIGINT"): Promise<void> {
    if (pending) return pending;
    options.state.stopping = true;
    let finished = false;
    let resolve!: () => void;
    pending = new Promise<void>((done) => { resolve = done; });
    options.logger.info({ signal }, "shutdown initiated");
    const finish = (code: number) => {
      if (finished) return;
      finished = true;
      clearTimeout(deadline);
      dispose();
      if (code === 0) options.logger.info({ signal }, "shutdown completed");
      else options.server.closeAllConnections();
      exit(code);
      resolve();
    };
    const deadline = setTimeout(() => {
      options.logger.error({ signal, timeoutMs: SHUTDOWN_TIMEOUT_MS }, "shutdown timed out");
      finish(1);
    }, SHUTDOWN_TIMEOUT_MS);
    void (async () => {
      options.stopWork?.();
      await new Promise<void>((done, reject) => {
        options.server.close((err) => err ? reject(err) : done());
        options.logger.info({ signal }, "server stopped accepting requests");
      });
      if (finished) return;
      for (const cleanup of options.cleanup ?? []) {
        await cleanup();
        if (finished) return;
      }
      options.logger.info({ signal }, "resources closed");
      finish(0);
    })().catch((err: unknown) => {
      if (finished) return;
      options.logger.error({ signal, err }, "shutdown failed");
      finish(1);
    });
    return pending;
  }
  signals.on("SIGTERM", handlers.SIGTERM);
  signals.on("SIGINT", handlers.SIGINT);
  return { shutdown, dispose };
}
