CREATE UNIQUE INDEX "Shipment_trackingNumber_key" ON "Shipment"("trackingNumber");
CREATE TABLE "OutboxEvent" (
    "id" TEXT PRIMARY KEY, "eventId" TEXT NOT NULL, "deduplicationKey" TEXT NOT NULL,
    "payload" TEXT NOT NULL, "traceparent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3), "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT, "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "OutboxEvent_eventId_key" ON "OutboxEvent"("eventId");
CREATE UNIQUE INDEX "OutboxEvent_deduplicationKey_key" ON "OutboxEvent"("deduplicationKey");
CREATE INDEX "OutboxEvent_publishedAt_nextAttemptAt_createdAt_idx" ON "OutboxEvent"("publishedAt", "nextAttemptAt", "createdAt");
