import { afterEach, describe, expect, it, vi } from "vitest";
import { closeDb } from "./db.js";

const mocks = vi.hoisted(() => ({ disconnect: vi.fn().mockResolvedValue(undefined), end: vi.fn().mockResolvedValue(undefined) }));
vi.mock("./index.js", () => ({ config: { nodeEnv: "production", databaseUrl: "postgresql://test:test@localhost/test_db" } }));
vi.mock("pg", () => ({ default: { Pool: class { end = mocks.end; } } }));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: class {} }));
vi.mock("../generated/prisma/index.js", () => ({ PrismaClient: class { $disconnect = mocks.disconnect; } }));

describe("catalog-service database cleanup", () => {
  afterEach(() => { vi.clearAllMocks(); mocks.disconnect.mockResolvedValue(undefined); });

  it("disconnects owned Prisma before closing owned pool", async () => {
    await closeDb();
    expect(mocks.disconnect).toHaveBeenCalledTimes(1);
    expect(mocks.end).toHaveBeenCalledTimes(1);
    expect(mocks.disconnect.mock.invocationCallOrder[0]).toBeLessThan(mocks.end.mock.invocationCallOrder[0]);
  });

  it("still closes pool when disconnect fails, preserving failure", async () => {
    const error = new Error("disconnect failed");
    mocks.disconnect.mockRejectedValue(error);
    await expect(closeDb()).rejects.toBe(error);
    expect(mocks.end).toHaveBeenCalledTimes(1);
  });
});
