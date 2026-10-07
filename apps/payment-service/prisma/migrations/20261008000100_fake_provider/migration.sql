CREATE TABLE "FakeProviderOperation" (
  "idempotencyKey" TEXT NOT NULL PRIMARY KEY,
  "requestFingerprint" TEXT NOT NULL,
  "result" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "FakeProviderOperation_reference_key" ON "FakeProviderOperation"("reference");
