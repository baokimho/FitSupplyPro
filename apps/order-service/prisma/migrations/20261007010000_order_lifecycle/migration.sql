ALTER TYPE "OrderStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "OrderStatus" ADD VALUE 'SHIPPED';
ALTER TYPE "OrderStatus" ADD VALUE 'DELIVERED';

ALTER TABLE "Order"
  ADD COLUMN "pendingStatus" "OrderStatus",
  ADD COLUMN "reservationConsumed" BOOLEAN NOT NULL DEFAULT false;

-- Before Phase 3, confirmation consumed reservations. Never release these again.
UPDATE "Order" SET "reservationConsumed" = true WHERE "status" = 'CONFIRMED';
