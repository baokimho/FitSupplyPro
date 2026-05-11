import prisma from "./db";
import { cleanupRefreshTokens } from "../utils/auth.helpers";

const REFRESH_TOKEN_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

export async function runRefreshTokenCleanup(): Promise<number> {
  const deletedCount = await cleanupRefreshTokens(prisma);

  if (deletedCount > 0) {
    console.log(`Deleted ${deletedCount} expired refresh tokens`);
  }

  return deletedCount;
}

export function startRefreshTokenCleanupJob(): NodeJS.Timeout {
  void runRefreshTokenCleanup().catch((error) => {
    console.error("Failed to clean refresh tokens:", error);
  });

  return setInterval(() => {
    void runRefreshTokenCleanup().catch((error) => {
      console.error("Failed to clean refresh tokens:", error);
    });
  }, REFRESH_TOKEN_CLEANUP_INTERVAL_MS);
}