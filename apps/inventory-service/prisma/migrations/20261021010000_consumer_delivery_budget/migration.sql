-- Operational attempt evidence; successful Inbox receipts stay unchanged.
CREATE TABLE "ConsumerDelivery" (
  "consumer" TEXT NOT NULL,
  "messageKey" TEXT NOT NULL,
  "replayCount" INTEGER NOT NULL DEFAULT 0,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ConsumerDelivery_pkey" PRIMARY KEY ("consumer", "messageKey", "replayCount"),
  CONSTRAINT "ConsumerDelivery_nonnegative" CHECK ("attempts" >= 0 AND "replayCount" >= 0)
);
