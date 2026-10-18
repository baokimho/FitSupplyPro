import { afterEach, expect, it, vi } from "vitest";
import { createLogger } from "../logging/logger.js";
import { ConflictError, ServiceUnavailableError } from "../errors/httpErrors.js";
import { getCorrelation, runWithCorrelation } from "../http/correlation.js";
import { retryDelay, retryOperation } from "./retry.js";
import { DependencyError } from "./failure.js";

const logger = createLogger({ service: "test", environment: "test", level: "silent" });
const policy = { dependency: "catalog", operation: "read", safe: true, logger,
  maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 150, random: () => 1 };
afterEach(() => { vi.useRealTimers(); });

it("caps exponential delay with bounded jitter", () => {
  expect([1, 2, 3, 100].map((n) => retryDelay(n, policy, () => 1))).toEqual([100, 150, 150, 150]);
  expect(retryDelay(1, policy, () => 0)).toBe(50);
});
it("retries transient work, keeps context, logs delay and final exhaustion", async () => {
  vi.useFakeTimers();
  const logs: string[] = [];
  const visible = createLogger({ service: "test", environment: "test" }, { write: (line: string) => { logs.push(line); } });
  const work = vi.fn(async () => { expect(getCorrelation()?.traceId).toBe("same-trace"); throw new ServiceUnavailableError(); });
  const pending = runWithCorrelation({ requestId: "same-request", traceId: "same-trace" }, () => retryOperation(work, { ...policy, logger: visible }));
  const assertion = expect(pending).rejects.toBeInstanceOf(ServiceUnavailableError);
  await vi.runAllTimersAsync();
  await assertion;
  expect(work).toHaveBeenCalledTimes(3);
  const entries = logs.map((line) => JSON.parse(line));
  expect(entries.map((entry) => entry.retryDelayMs)).toEqual([100, 150, undefined]);
  expect(entries[2]).toMatchObject({ exhausted: true, traceId: "same-trace", attempt: 3, maxAttempts: 3 });
});
it("never retries permanent errors or unprotected ambiguous mutations", async () => {
  for (const error of [new ConflictError("mismatch"), new Error("bug"), new DependencyError("notification", "create", "ambiguous", false)]) {
    const work = vi.fn().mockRejectedValue(error);
    await expect(retryOperation(work, policy)).rejects.toBe(error);
    expect(work).toHaveBeenCalledOnce();
  }
});
it("cancels backoff immediately without another attempt or leaked timer", async () => {
  vi.useFakeTimers();
  const controller = new AbortController();
  const work = vi.fn().mockRejectedValue(new ServiceUnavailableError());
  const pending = retryOperation(work, { ...policy, signal: controller.signal });
  const assertion = expect(pending).rejects.toMatchObject({ name: "AbortError" });
  await vi.advanceTimersByTimeAsync(0);
  controller.abort();
  await assertion;
  expect(work).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(0);
});
it("concurrent unavailable operations each obey their single bounded budget", async () => {
  vi.useFakeTimers();
  const work = vi.fn().mockRejectedValue(new ServiceUnavailableError());
  const pending = Promise.allSettled(Array.from({ length: 20 }, () => retryOperation(work, policy)));
  await vi.runAllTimersAsync();
  const results = await pending;
  expect(results.every((result) => result.status === "rejected")).toBe(true);
  expect(work).toHaveBeenCalledTimes(60);
});
