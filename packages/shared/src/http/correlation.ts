import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

export type CorrelationContext = Readonly<{ requestId: string; traceId: string }>;

declare global {
  namespace Express {
    interface Request {
      correlation?: CorrelationContext;
    }
  }
}

const context = new AsyncLocalStorage<CorrelationContext>();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validCorrelationId(value: unknown): value is string {
  return typeof value === "string" && value.length === 36 && uuid.test(value);
}

export function getCorrelation(): CorrelationContext | undefined {
  return context.getStore();
}

/** Broker deliveries establish independent context without an HTTP request. */
export function runWithCorrelation<T>(correlation: CorrelationContext, work: () => T): T {
  return context.run(Object.freeze({ ...correlation }), work);
}

/** Gateway owns trace identity; internal hops preserve valid propagated context. */
export function correlationMiddleware(boundary: "gateway" | "service"): RequestHandler {
  return (req, res, next) => {
    const requestId = req.headers["x-request-id"];
    const traceId = req.headers["x-trace-id"];
    const correlation = Object.freeze({
      requestId: validCorrelationId(requestId) ? requestId : randomUUID(),
      traceId: boundary === "service" && validCorrelationId(traceId) ? traceId : randomUUID(),
    });
    req.correlation = correlation;
    res.setHeader("x-request-id", correlation.requestId);
    context.run(correlation, next);
  };
}

/** A new request ID per outgoing hop; one trace across the synchronous workflow. */
export function correlationHeaders(correlation = getCorrelation()): Record<string, string> {
  return correlation ? { "x-request-id": randomUUID(), "x-trace-id": correlation.traceId } : {};
}
