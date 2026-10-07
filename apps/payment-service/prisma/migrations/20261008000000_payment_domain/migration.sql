ALTER TYPE "PaymentStatus" RENAME VALUE 'PAID' TO 'SUCCEEDED';
ALTER TABLE "Payment" ADD COLUMN "pendingOperation" TEXT,
ADD COLUMN "failureCode" TEXT,
ADD COLUMN "orderConfirmedAt" TIMESTAMP(3);
