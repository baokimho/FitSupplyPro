-- Preserve legacy cancellations as failed attempts, without resetting any attempt.
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');
ALTER TABLE "Payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus_new"
USING (CASE WHEN "status"::text = 'CANCELLED' THEN 'FAILED' ELSE "status"::text END)::"PaymentStatus_new";
DROP TYPE "PaymentStatus";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_orderId_key";
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
-- Failed attempts can be retried. A refunded order cannot be charged again in Phase 4.
CREATE UNIQUE INDEX "Payment_one_payable_attempt_per_order"
ON "Payment"("orderId") WHERE "status" <> 'FAILED';
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_operation_valid"
CHECK ("pendingOperation" IS NULL OR "pendingOperation" IN ('SUCCEEDED', 'FAILED', 'REFUNDED'));

-- Keep durable replay bodies consistent with the renamed lifecycle and money contract.
UPDATE "PaymentIdempotency" i
SET "responseBody" = jsonb_set(i."responseBody", '{amount}', to_jsonb(p."amount"::text))
FROM "Payment" p WHERE i."paymentId" = p."id" AND i."responseBody" IS NOT NULL;
UPDATE "PaymentIdempotency" SET "responseBody" = jsonb_set("responseBody", '{status}', '"SUCCEEDED"'::jsonb)
WHERE "responseBody"->>'status' = 'PAID';
UPDATE "PaymentIdempotency" SET "responseBody" = jsonb_set("responseBody", '{status}', '"FAILED"'::jsonb)
WHERE "responseBody"->>'status' = 'CANCELLED';
