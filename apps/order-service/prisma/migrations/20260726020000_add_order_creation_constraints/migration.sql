ALTER TABLE "Order"
  ADD CONSTRAINT "Order_totalAmount_nonnegative_chk" CHECK ("totalAmount" >= 0),
  ADD CONSTRAINT "Order_delivery_snapshot_complete_or_absent_chk" CHECK (
    (
      "recipientName" IS NULL AND
      "contactPhone" IS NULL AND
      "deliveryAddressLine1" IS NULL AND
      "deliveryCity" IS NULL AND
      "deliveryPostalCode" IS NULL AND
      "deliveryCountryCode" IS NULL
    ) OR (
      length(btrim("recipientName")) > 0 AND
      length(btrim("contactPhone")) > 0 AND
      length(btrim("deliveryAddressLine1")) > 0 AND
      length(btrim("deliveryCity")) > 0 AND
      length(btrim("deliveryPostalCode")) > 0 AND
      "deliveryCountryCode" ~ '^[A-Z]{2}$'
    )
  );

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_quantity_positive_chk" CHECK ("quantity" > 0),
  ADD CONSTRAINT "OrderItem_unitPrice_nonnegative_chk" CHECK ("unitPrice" >= 0),
  ADD CONSTRAINT "OrderItem_subtotal_nonnegative_chk" CHECK ("subtotal" >= 0),
  ADD CONSTRAINT "OrderItem_subtotal_matches_unit_price_chk" CHECK ("subtotal" = ("unitPrice" * "quantity"));

CREATE UNIQUE INDEX "OrderItem_orderId_productId_key"
  ON "OrderItem"("orderId", "productId");
