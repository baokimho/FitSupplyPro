import { afterEach, describe, expect, it, vi } from "vitest";
import { runRefreshTokenCleanup, startRefreshTokenCleanupJob } from "./refresh-token-cleanup.js";

const mocks = vi.hoisted(() => ({ cleanup: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }));
vi.mock("./db.js", () => ({ default: {} }));
vi.mock("../services/auth.service.js", () => ({ cleanupRefreshTokens: mocks.cleanup }));
vi.mock("../logger.js", () => ({ logger: mocks }));

describe("refresh-token cleanup logging", () => {
  afterEach(() => { vi.clearAllMocks(); vi.useRealTimers(); });

  it("logs count only when expired tokens deleted", async () => {
    mocks.cleanup.mockResolvedValueOnce(0).mockResolvedValueOnce(3);
    await expect(runRefreshTokenCleanup()).resolves.toBe(0);
    expect(mocks.info).not.toHaveBeenCalled();
    await expect(runRefreshTokenCleanup()).resolves.toBe(3);
    expect(mocks.info).toHaveBeenCalledWith({ deletedCount: 3, operation: "refresh-token-cleanup" }, "expired refresh tokens deleted");
  });

  it("keeps recoverable database authentication failure at warn without credentials", async () => {
    mocks.cleanup.mockRejectedValue(Object.assign(new Error("private-db-password"), { code: "P1000" }));
    await expect(runRefreshTokenCleanup()).resolves.toBe(0);
    expect(mocks.warn).toHaveBeenCalledWith({ operation: "refresh-token-cleanup" }, "cleanup skipped: database authentication failed");
    expect(JSON.stringify(mocks.warn.mock.calls)).not.toContain("private-db-password");
  });

  it("job logs original unexpected error once", async () => {
    vi.useFakeTimers();
    const error = new Error("cleanup failed");
    mocks.cleanup.mockRejectedValue(error);
    const job = startRefreshTokenCleanupJob();
    await vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000);
    clearInterval(job);
    expect(mocks.error).toHaveBeenCalledExactlyOnceWith({ err: error, operation: "refresh-token-cleanup" }, "refresh token cleanup failed");
  });
});
