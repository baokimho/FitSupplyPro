import { afterEach, expect, it, vi } from "vitest";
import { createLogger } from "../logging/logger.js";
import { fetchDependency, withDependencyTimeout } from "./timeout.js";
import { readProxyTimeout, readResilienceConfig } from "./config.js";

const options = { dependency: "inventory", operation: "reserve", safe: false, mutation: true, timeoutMs: 25 };
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

it("validates timeout and retry configuration without exposing values", () => {
  expect(readResilienceConfig({})).toEqual({ timeoutMs: 2500, maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 1000 });
  expect(readProxyTimeout({})).toBe(30000);
  for (const key of ["DEPENDENCY_TIMEOUT_MS", "DEPENDENCY_MAX_ATTEMPTS", "RETRY_BASE_DELAY_MS", "RETRY_MAX_DELAY_MS"]) {
    for (const value of ["", "0", "-1", "secret", "60001"]) expect(() => readResilienceConfig({ [key]: value })).toThrow(`Configuration variable ${key}`);
  }
  expect(() => readResilienceConfig({ DEPENDENCY_MAX_ATTEMPTS: "6" })).toThrow();
});
it("aborts timed out work and logs limit, dependency and elapsed time", async () => {
  vi.useFakeTimers();
  const logs: string[] = [];
  const logger = createLogger({ service: "test", environment: "test" }, { write: (line: string) => { logs.push(line); } });
  let signal!: AbortSignal;
  const pending = withDependencyTimeout(async (value) => { signal = value; return new Promise(() => {}); }, { ...options, logger });
  const assertion = expect(pending).rejects.toMatchObject({ failureClass: "ambiguous", retrySafe: false, timeoutMs: 25 });
  await vi.advanceTimersByTimeAsync(25);
  await assertion;
  expect(signal.aborted).toBe(true);
  expect(JSON.parse(logs[0])).toMatchObject({ dependency: "inventory", operation: "reserve", timeoutMs: 25, elapsedMs: expect.any(Number) });
  expect(vi.getTimerCount()).toBe(0);
});
it("bounds body consumption and removes deadline after success", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(new ReadableStream())));
  const pending = fetchDependency("http://test", undefined, { ...options, safe: true });
  const assertion = expect(pending).rejects.toMatchObject({ failureClass: "transient" });
  await vi.advanceTimersByTimeAsync(25);
  await assertion;
  vi.stubGlobal("fetch", vi.fn(async () => new Response("ok")));
  expect((await fetchDependency("http://test", undefined, options)).text).toBe("ok");
  expect(vi.getTimerCount()).toBe(0);
});
it("shutdown cancellation stays distinct from dependency timeout", async () => {
  vi.useFakeTimers();
  const controller = new AbortController();
  const pending = withDependencyTimeout(async () => new Promise(() => {}), { ...options, signal: controller.signal });
  const assertion = expect(pending).rejects.toMatchObject({ name: "AbortError" });
  controller.abort(new DOMException("shutdown", "AbortError"));
  await assertion;
  expect(vi.getTimerCount()).toBe(0);
});
