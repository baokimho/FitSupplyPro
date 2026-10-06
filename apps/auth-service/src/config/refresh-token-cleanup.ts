import { logger } from "../logger.js";
import prisma from "./db.js";
import { cleanupRefreshTokens } from "../services/auth.service.js";

const REFRESH_TOKEN_CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

function isPrismaAuthError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "P1000";
}

export async function runRefreshTokenCleanup(): Promise<number> {
  try {
    const deletedCount = await cleanupRefreshTokens(prisma);

    if (deletedCount > 0) {
      logger.info({ deletedCount, operation: "refresh-token-cleanup" }, "expired refresh tokens deleted");
    }

    return deletedCount;
  } catch (error) {
    if (isPrismaAuthError(error)) {
      logger.warn({ operation: "refresh-token-cleanup" }, "cleanup skipped: database authentication failed");
      return 0;
    }

    throw error;
  }
}

export function startRefreshTokenCleanupJob(): NodeJS.Timeout {
  return setInterval(() => {
    void runRefreshTokenCleanup().catch((error) => {
      logger.error({ err: error, operation: "refresh-token-cleanup" }, "refresh token cleanup failed");
    });
  }, REFRESH_TOKEN_CLEANUP_INTERVAL_MS);
}
