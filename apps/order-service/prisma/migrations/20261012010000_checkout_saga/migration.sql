CREATE TYPE "CheckoutSagaState" AS ENUM ('RESERVING', 'PAYING', 'CONFIRMING', 'REFUNDING', 'RELEASING', 'COMPLETED', 'CANCELLED', 'COMPENSATED', 'FAILED');
CREATE TABLE "CheckoutSaga" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL UNIQUE REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "state" "CheckoutSagaState" NOT NULL DEFAULT 'RESERVING',
  "correlationId" TEXT NOT NULL,
  "inventoryReserved" BOOLEAN NOT NULL DEFAULT false,
  "inventoryReleased" BOOLEAN NOT NULL DEFAULT false,
  "paymentId" TEXT,
  "paymentEventId" TEXT,
  "paymentEventFingerprint" TEXT,
  "paymentOutcome" TEXT,
  "failureCode" TEXT,
  "failedStep" TEXT,
  "compensationError" TEXT,
  "compensationRetryable" BOOLEAN,
  "lastEventId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "CheckoutSaga_state_updatedAt_idx" ON "CheckoutSaga"("state", "updatedAt");
ALTER TABLE "CheckoutSaga" ADD CONSTRAINT "CheckoutSaga_paymentOutcome_check" CHECK ("paymentOutcome" IS NULL OR "paymentOutcome" IN ('SUCCEEDED', 'FAILED', 'REFUNDED'));

-- Phase 7 has no workflow ledger. Do not invent compensation completion for old cancellations.
INSERT INTO "CheckoutSaga" ("id", "orderId", "state", "correlationId", "inventoryReserved", "paymentOutcome", "failedStep", "failureCode", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id",
  CASE WHEN "status"::text IN ('CONFIRMED','PROCESSING','SHIPPED','DELIVERED') THEN 'COMPLETED'::"CheckoutSagaState" ELSE 'FAILED'::"CheckoutSagaState" END,
  "creationEvent"::jsonb->>'correlationId', "status"::text IN ('CONFIRMED','PROCESSING','SHIPPED','DELIVERED'),
  CASE WHEN "status"::text IN ('CONFIRMED','PROCESSING','SHIPPED','DELIVERED') THEN 'SUCCEEDED' ELSE NULL END,
  CASE WHEN "status"::text IN ('CONFIRMED','PROCESSING','SHIPPED','DELIVERED') THEN NULL ELSE 'LEGACY' END,
  CASE WHEN "status"::text IN ('CONFIRMED','PROCESSING','SHIPPED','DELIVERED') THEN NULL ELSE 'LEGACY_PROGRESS_REPLAY_REQUIRED' END,
  "createdAt", CURRENT_TIMESTAMP
FROM "Order" WHERE "eventDriven" AND "creationEvent" IS NOT NULL;
