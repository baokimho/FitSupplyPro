import { assertSafeTestDatabaseUrl, type TestDatabaseName } from "./integration.js";

export type CleanupDatabaseName = TestDatabaseName;

export interface SqlExecutor {
  execute(sql: string): Promise<void>;
}

const cleanupTables: Record<CleanupDatabaseName, readonly string[]> = {
  auth_test_db: ["RefreshToken", "User"],
  catalog_test_db: ["Product", "Category", "Brand"],
  inventory_test_db: ["Inventory"],
  order_test_db: ["OrderItem", "Order"],
  cart_test_db: ["CartItem", "Cart"],
  payment_test_db: ["Payment"],
  shipping_test_db: ["Shipment"],
  notification_test_db: ["Notification"],
};

function quoteIdentifier(identifier: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

export function getCleanupTables(databaseName: CleanupDatabaseName): readonly string[] {
  return cleanupTables[databaseName];
}

export function buildCleanupSql(databaseName: CleanupDatabaseName): string {
  const tables = cleanupTables[databaseName];
  if (!tables.length) {
    throw new Error(`No cleanup tables configured for ${databaseName}`);
  }

  return `TRUNCATE TABLE ${tables.map(quoteIdentifier).join(", ")} RESTART IDENTITY CASCADE;`;
}

export async function cleanupDatabase(
  databaseName: CleanupDatabaseName,
  databaseUrl: string,
  executor: SqlExecutor,
): Promise<void> {
  assertSafeTestDatabaseUrl(databaseName, databaseUrl);
  await executor.execute(buildCleanupSql(databaseName));
}