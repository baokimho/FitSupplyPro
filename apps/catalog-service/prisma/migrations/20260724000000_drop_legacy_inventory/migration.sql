-- Catalog service no longer owns inventory records. Inventory is owned by inventory-service.
-- This removes the legacy catalog Inventory table created by the initial catalog migration.
DROP TABLE IF EXISTS "Inventory";