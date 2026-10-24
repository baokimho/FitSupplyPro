import type { RequestHandler } from "express";
import type { Logger } from "./logger.js";
import { telemetryHttp, activeTraceFields } from "../observability/telemetry.js";

/** Exclude queries/fragments; never include headers or bodies in HTTP events. */
export function logPath(url: string): string {
  return url.split(/[?#]/, 1)[0];
}

export function httpLogger(logger: Logger): RequestHandler {
  const telemetry = telemetryHttp(String(logger.bindings?.()?.service ?? "unknown"));
  return (req, res, next) => {
    telemetry(req, res, () => {
      const started = process.hrtime.bigint();
      const method = req.method;
      const path = logPath(req.originalUrl);
      const traceFields = activeTraceFields();
      res.once("finish", () => {
        const fields = { ...req.correlation, ...traceFields, method, path, statusCode: res.statusCode, durationMs: Number(process.hrtime.bigint() - started) / 1e6 };
        logger.info(fields, "request completed");
      });
      next();
    });
  };
}
