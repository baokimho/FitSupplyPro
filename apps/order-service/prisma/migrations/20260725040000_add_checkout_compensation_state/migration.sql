ALTER TABLE "CheckoutIdempotency"
  ADD COLUMN "reservedItems" JSONB,
  ADD COLUMN "compensationError" TEXT;
