import prisma from "./db.js";
import { cleanupRefreshTokens } from "../utils/auth.helpers.js";

const REFRESH_TOKEN_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

function isPrismaAuthError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P1000";
}

export async function runRefreshTokenCleanup(): Promise<number> {
  try {
    const deletedCount = await cleanupRefreshTokens(prisma);

    if (deletedCount > 0) {
      console.log(`Deleted ${deletedCount} expired refresh tokens`);
    }

    return deletedCount;
  } catch (error) {
    if (isPrismaAuthError(error)) {
      console.warn("Skipping refresh token cleanup because database authentication failed");
      return 0;
    }

    throw error;
  }
}

export function startRefreshTokenCleanupJob(): NodeJS.Timeout {
  return setInterval(() => {
    void runRefreshTokenCleanup().catch((error) => {
      console.error("Failed to clean refresh tokens:", error);
    });
  }, REFRESH_TOKEN_CLEANUP_INTERVAL_MS);
}