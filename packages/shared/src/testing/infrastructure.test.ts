import { describe, expect, it, vi } from "vitest";
import {
  assertSafeTestDatabaseUrl,
  getServiceBaseUrl,
  readIntegrationTestEnv,
  requireTestDatabaseUrl,
  usingTestResource,
  waitForHttpOk,
} from "../index.js";

describe("integration test infrastructure", () => {
  it("loads typed test environment values", () => {
    const env = readIntegrationTestEnv({
      AUTH_DATABASE_URL: "postgresql://fitsupply_test:fitsupply_test@localhost:55433/auth_test_db",
      API_GATEWAY_URL: "http://localhost:3500/",
      GATEWAY_SECRET: "test-secret",
    });

    expect(env.databaseUrls.auth_test_db).toBe(
      "postgresql://fitsupply_test:fitsupply_test@localhost:55433/auth_test_db",
    );
    expect(env.serviceBaseUrls["api-gateway"]).toBe("http://localhost:3500");
    expect(env.gatewaySecret).toBe("test-secret");
  });

  it("rejects unsafe database URLs clearly", () => {
    expect(() =>
      assertSafeTestDatabaseUrl("auth_test_db", "postgresql://fitsupply:fitsupply@localhost:5433/auth_db"),
    ).toThrow("auth_test_db DATABASE_URL must target auth_test_db");

    expect(() =>
      requireTestDatabaseUrl("auth_test_db", {}),
    ).toThrow("AUTH_DATABASE_URL is required for integration tests");
  });

  it("provides service base URL lookup", () => {
    expect(getServiceBaseUrl("api-gateway", { API_GATEWAY_URL: "http://localhost:3500/" })).toBe(
      "http://localhost:3500",
    );
  });

  it("waits for HTTP readiness with bounded retries", async () => {
    const fetchImpl = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    await waitForHttpOk({
      url: "http://service.test/health",
      timeoutMs: 100,
      intervalMs: 1,
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("cleans up resources opened by tests", async () => {
    const cleaned: string[] = [];

    await usingTestResource(
      async () => "resource-id",
      async (resource) => {
        cleaned.push(resource);
      },
      async (resource) => {
        expect(resource).toBe("resource-id");
      },
    );

    expect(cleaned).toEqual(["resource-id"]);
  });
  it("bounds stalled readiness fetch even when fake transport ignores AbortSignal", async () => {
    vi.useFakeTimers();
    try {
      let signal: AbortSignal | undefined;
      const fetchImpl = vi.fn<typeof fetch>((_url, init) => { signal = init?.signal ?? undefined; return new Promise<Response>(() => {}); });
      const waiting = waitForHttpOk({ url: "http://service.test/ready", timeoutMs: 100, fetchImpl });
      const assertion = expect(waiting).rejects.toThrow("Timed out waiting for");
      await vi.advanceTimersByTimeAsync(100);
      await assertion;
      expect(signal?.aborted).toBe(true);
      expect(fetchImpl).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });
  it("cleans resources when tested operation throws", async () => {
    const cleanup = vi.fn(async () => {});
    await expect(usingTestResource(async () => "fixture", cleanup, async () => { throw new Error("operation failed"); })).rejects.toThrow("operation failed");
    expect(cleanup).toHaveBeenCalledWith("fixture");
  });
});
