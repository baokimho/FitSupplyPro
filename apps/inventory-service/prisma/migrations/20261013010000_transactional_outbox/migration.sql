CREATE TABLE "OutboxEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "eventId" TEXT NOT NULL UNIQUE,
  "deduplicationKey" TEXT NOT NULL UNIQUE,
  "payload" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "OutboxEvent_publishedAt_nextAttemptAt_createdAt_idx" ON "OutboxEvent"("publishedAt", "nextAttemptAt", "createdAt");
-- Retained Phase 7/8 outputs are safely republished with their original event IDs.
INSERT INTO "OutboxEvent" ("id","eventId","deduplicationKey","payload")
SELECT gen_random_uuid()::text, "result"::jsonb->>'eventId', "result"::jsonb->>'eventId', "result"
FROM "CheckoutEvent" WHERE "result" IS NOT NULL;
