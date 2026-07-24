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
});