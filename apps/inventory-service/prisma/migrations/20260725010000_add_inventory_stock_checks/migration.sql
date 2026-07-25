ALTER TABLE "Inventory"
  ADD CONSTRAINT "Inventory_stock_nonnegative" CHECK ("stock" >= 0),
  ADD CONSTRAINT "Inventory_reservedStock_nonnegative" CHECK ("reservedStock" >= 0),
  ADD CONSTRAINT "Inventory_reservedStock_lte_stock" CHECK ("reservedStock" <= "stock");
