CREATE TABLE "CheckoutIdempotency" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "requestFingerprint" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "orderId" TEXT,
  "responseBody" JSONB,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CheckoutIdempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CheckoutIdempotency_userId_idempotencyKey_key"
  ON "CheckoutIdempotency"("userId", "idempotencyKey");

CREATE INDEX "CheckoutIdempotency_orderId_idx" ON "CheckoutIdempotency"("orderId");

ALTER TABLE "CheckoutIdempotency"
  ADD CONSTRAINT "CheckoutIdempotency_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
