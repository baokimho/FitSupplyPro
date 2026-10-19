import { setTimeout as delay } from "node:timers/promises";
import type { Logger } from "../logging/logger.js";
import { canRetry, classifyFailure } from "./failure.js";
import { dependencyShutdownSignal } from "./timeout.js";

export type RetryPolicy = { maxAttempts: number; baseDelayMs: number; maxDelayMs: number };
export function retryDelay(attempt: number, policy: Pick<RetryPolicy, "baseDelayMs" | "maxDelayMs">, random = Math.random) {
  const cap = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** Math.min(attempt - 1, 30));
  return Math.floor(cap * (0.5 + random() * 0.5));
}

/** One retry owner. Safety comes from caller's operation identity, never HTTP method alone. */
export async function retryOperation<T>(work: (attempt: number) => Promise<T>, options: RetryPolicy & {
  dependency: string; operation: string; safe: boolean; logger: Logger;
  signal?: AbortSignal; random?: () => number;
  timeoutMs?: number;
}): Promise<T> {
  if (!Number.isInteger(options.maxAttempts) || options.maxAttempts < 1 || options.maxAttempts > 5 ||
      !Number.isFinite(options.baseDelayMs) || options.baseDelayMs < 1 ||
      !Number.isFinite(options.maxDelayMs) || options.maxDelayMs < 1) throw new RangeError("Invalid retry policy");
  const signal = options.signal ?? dependencyShutdownSignal;
  for (let attempt = 1; ; attempt++) {
    signal.throwIfAborted();
    try { return await work(attempt); }
    catch (error) {
      signal.throwIfAborted();
      const retryable = canRetry(error, options.safe);
      const context = { dependency: options.dependency, operation: options.operation,
        failureClass: classifyFailure(error), attempt, maxAttempts: options.maxAttempts, timeoutMs: options.timeoutMs };
      if (!retryable || attempt === options.maxAttempts) {
        options.logger.warn({ ...context, exhausted: retryable && attempt === options.maxAttempts }, "dependency attempts ended");
        throw error;
      }
      const retryDelayMs = retryDelay(attempt, options, options.random);
      options.logger.warn({ ...context, retryDelayMs, exhausted: false }, "dependency retry scheduled");
      await delay(retryDelayMs, undefined, { signal });
    }
  }
}
