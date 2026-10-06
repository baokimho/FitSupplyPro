import { Router } from "express";
import type { Logger } from "../logging/logger.js";

export const READINESS_TIMEOUT_MS = 3000;

export function createHealthRouter(options: {
  service: string;
  logger: Logger;
  isReady: () => boolean;
  checkReady?: () => Promise<unknown>;
}) {
  const router = Router();
  router.get("/health", (_req, res) => res.json({ status: "ok", service: options.service }));
  router.get("/ready", async (req, res) => {
    let timer: NodeJS.Timeout | undefined;
    try {
      if (options.isReady() && options.checkReady) {
        // ponytail: response deadline does not cancel driver query; add cancellation if needed.
        await Promise.race([
          options.checkReady(),
          new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => reject(new Error("Readiness check timed out")), READINESS_TIMEOUT_MS);
          }),
        ]);
      }
      const ready = options.isReady();
      res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "not_ready", service: options.service });
    } catch (err) {
      options.logger.warn({ ...req.correlation, err, operation: "readiness" }, "readiness check failed");
      res.status(503).json({ status: "not_ready", service: options.service });
    } finally {
      if (timer) clearTimeout(timer);
    }
  });
  return router;
}
