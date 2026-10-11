CREATE TABLE "CheckoutEvent" (
  "eventId" TEXT NOT NULL PRIMARY KEY,
  "fingerprint" TEXT NOT NULL,
  "result" TEXT
);
ALTER TABLE "Order" ADD COLUMN "eventDriven" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN "creationEvent" TEXT;
