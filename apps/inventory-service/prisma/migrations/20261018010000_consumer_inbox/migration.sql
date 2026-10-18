-- Preserve historical receipts; their incoming type was not recorded.
ALTER TABLE "CheckoutEvent" ADD COLUMN "eventType" TEXT,
ADD COLUMN "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
