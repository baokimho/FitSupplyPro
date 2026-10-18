import { DependencyError } from "./failure.js";
import type { Logger } from "../logging/logger.js";

const shutdown = new AbortController();
export const dependencyShutdownSignal = shutdown.signal;
export const stopDependencyWork = () => shutdown.abort(new DOMException("Service shutting down", "AbortError"));

export type DependencyOptions = {
  dependency: string; operation: string; timeoutMs: number; safe: boolean;
  logger?: Logger; signal?: AbortSignal;
};

/** Bound whole operation, including response body; adapters must honor cancellation. */
export async function withDependencyTimeout<T>(work: (signal: AbortSignal) => Promise<T>, options: DependencyOptions): Promise<T> {
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
      const failureClass = options.safe ? "transient" : "ambiguous";
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
  return withDependencyTimeout(async (signal) => {
    let response: Response;
    try { response = await fetch(url, { ...init, signal: init?.signal ? AbortSignal.any([signal, init.signal]) : signal }); }
    catch (cause) {
      if (signal.aborted || init?.signal?.aborted) throw cause;
      throw new DependencyError(options.dependency, options.operation, options.safe ? "transient" : "ambiguous", options.safe, options.timeoutMs, cause);
    }
    try { return { response, text: await response.text() }; }
    catch (cause) {
      if (signal.aborted) throw cause;
      throw new DependencyError(options.dependency, options.operation, options.safe ? "transient" : "ambiguous", options.safe, options.timeoutMs, cause);
    }
  }, options);
}
