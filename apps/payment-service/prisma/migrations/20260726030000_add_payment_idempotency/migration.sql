ALTER TABLE "Payment"
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN "providerPaymentId" TEXT,
ADD COLUMN "progressState" TEXT NOT NULL DEFAULT 'CREATED';

DROP INDEX "Payment_orderId_idx";

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_orderId_key" UNIQUE ("orderId");

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_providerPaymentId_key" UNIQUE ("providerPaymentId");

ALTER TABLE "Payment"
ADD CONSTRAINT "Payment_orderId_not_blank" CHECK (length(btrim("orderId")) > 0),
ADD CONSTRAINT "Payment_userId_not_blank" CHECK (length(btrim("userId")) > 0),
ADD CONSTRAINT "Payment_currency_not_blank" CHECK (length(btrim("currency")) > 0),
ADD CONSTRAINT "Payment_amount_non_negative" CHECK ("amount" >= 0);

CREATE TABLE "PaymentIdempotency" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "requestFingerprint" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "paymentId" TEXT,
    "responseBody" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIdempotency_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PaymentIdempotency_userId_not_blank" CHECK (length(btrim("userId")) > 0),
    CONSTRAINT "PaymentIdempotency_action_not_blank" CHECK (length(btrim("action")) > 0),
    CONSTRAINT "PaymentIdempotency_key_not_blank" CHECK (length(btrim("idempotencyKey")) > 0),
    CONSTRAINT "PaymentIdempotency_fingerprint_not_blank" CHECK (length(btrim("requestFingerprint")) > 0)
);

CREATE UNIQUE INDEX "PaymentIdempotency_userId_action_idempotencyKey_key"
ON "PaymentIdempotency"("userId", "action", "idempotencyKey");

CREATE INDEX "PaymentIdempotency_paymentId_idx" ON "PaymentIdempotency"("paymentId");
