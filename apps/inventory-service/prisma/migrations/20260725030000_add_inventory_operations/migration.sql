CREATE TABLE "InventoryOperation" (
  "id" TEXT NOT NULL,
  "operationId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InventoryOperation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InventoryOperation_operationId_key"
  ON "InventoryOperation"("operationId");

CREATE INDEX "InventoryOperation_productId_idx"
  ON "InventoryOperation"("productId");

ALTER TABLE "InventoryOperation"
  ADD CONSTRAINT "InventoryOperation_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Inventory"("productId") ON DELETE CASCADE ON UPDATE CASCADE;
