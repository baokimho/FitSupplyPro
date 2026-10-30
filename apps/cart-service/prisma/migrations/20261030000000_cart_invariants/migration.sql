ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_quantity_positive" CHECK ("quantity" > 0),
    ADD CONSTRAINT "CartItem_price_nonnegative" CHECK ("priceSnapshot" >= 0);
ALTER TABLE "Cart" ADD CONSTRAINT "Cart_version_positive" CHECK ("version" > 0);
CREATE TABLE "CartCheckoutRemoval" (
    "cartId" TEXT NOT NULL, "cartVersion" INTEGER NOT NULL, "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("cartId", "cartVersion"),
    CONSTRAINT "CartCheckoutRemoval_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
