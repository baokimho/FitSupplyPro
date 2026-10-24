import { DependencyError, classifyFailure } from "./failure.js";
import { count, observe, dependencyLabels, traced, SpanKind, traceHeaders, telemetryContext, spanError } from "../observability/telemetry.js";
import { trace } from "@opentelemetry/api";
import type { Logger } from "../logging/logger.js";

const shutdown = new AbortController();
export const dependencyShutdownSignal = shutdown.signal;
export const stopDependencyWork = () => shutdown.abort(new DOMException("Service shutting down", "AbortError"));

export type DependencyOptions = {
  dependency: string; operation: string; timeoutMs: number; safe: boolean;
  logger?: Logger; signal?: AbortSignal;
  mutation?: boolean;
};

/** Bound whole operation, including response body; adapters must honor cancellation. */
export async function withDependencyTimeout<T>(work: (signal: AbortSignal) => Promise<T>, options: DependencyOptions): Promise<T> {
  const labels = dependencyLabels(options.dependency, options.operation);
  const started = performance.now();
  return traced("dependency request", SpanKind.CLIENT, { "peer.service": labels.dependency, operation: labels.operation }, async () => {
    let result = "success";
    try {
      const value = await runDependencyTimeout(work, options);
      if (typeof value === "object" && value !== null && "response" in value && value.response instanceof Response && value.response.status >= 400) {
        result = "http_error";
        count("service_client_errors_total", { ...labels, error_class: "http_error" });
        const span = trace.getSpan(telemetryContext.active()); if (span) spanError(span, "http_error");
      }
      return value;
    } catch (error) { result = "error"; count("service_client_errors_total", { ...labels, error_class: classifyFailure(error) }); throw error; }
    finally { count("service_client_requests_total", { ...labels, result }); observe("service_client_request_duration_seconds", (performance.now() - started) / 1000, { ...labels, result }); }
  });
}

async function runDependencyTimeout<T>(work: (signal: AbortSignal) => Promise<T>, options: DependencyOptions): Promise<T> {
  const parent = options.signal ?? dependencyShutdownSignal;
  parent.throwIfAborted();
  const controller = new AbortController();
  const started = performance.now();
  let timedOut = false;
  const cancel = () => controller.abort(parent.reason);
  parent.addEventListener("abort", cancel, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(new DOMException("Dependency timed out", "TimeoutError")); }, options.timeoutMs);
  let onAbort!: () => void;
  try {
    return await Promise.race([work(controller.signal), new Promise<never>((_resolve, reject) => {
      onAbort = () => reject(controller.signal.reason);
      controller.signal.addEventListener("abort", onAbort, { once: true });
      if (controller.signal.aborted) onAbort();
    })]);
  } catch (cause) {
    if (parent.aborted) throw parent.reason;
    if (timedOut) {
      const failureClass = options.mutation ? "ambiguous" : "transient";
      options.logger?.warn({ dependency: options.dependency, operation: options.operation, failureClass,
        timeoutMs: options.timeoutMs, elapsedMs: Math.round(performance.now() - started) }, "dependency timeout");
      throw new DependencyError(options.dependency, options.operation, failureClass, options.safe, options.timeoutMs, cause);
    }
    throw cause;
  } finally {
    clearTimeout(timer);
    parent.removeEventListener("abort", cancel);
    if (onAbort) controller.signal.removeEventListener("abort", onAbort);
  }
}

/** One attempt; caller owns retries and retains operation identity and request body. */
export async function fetchDependency(url: string | URL, init: RequestInit | undefined, options: DependencyOptions) {
  const failureClass = (init?.method ?? "GET") === "GET" ? "transient" : "ambiguous";
  return withDependencyTimeout(async (signal) => {
    let response: Response;
    try {
      const headers = { ...Object.fromEntries(new Headers(init?.headers)), ...traceHeaders() };
      response = await fetch(url, { ...init, headers, signal: init?.signal ? AbortSignal.any([signal, init.signal]) : signal });
      trace.getSpan(telemetryContext.active())?.setAttribute("http.response.status_code", response.status);
    }
    catch (cause) {
      if (signal.aborted || init?.signal?.aborted) throw cause;
      throw new DependencyError(options.dependency, options.operation, failureClass, options.safe, options.timeoutMs, cause);
    }
    try { return { response, text: await response.text() }; }
    catch (cause) {
      if (signal.aborted) throw cause;
      throw new DependencyError(options.dependency, options.operation, failureClass, options.safe, options.timeoutMs, cause);
    }
  }, { ...options, mutation: (init?.method ?? "GET") !== "GET" });
}
