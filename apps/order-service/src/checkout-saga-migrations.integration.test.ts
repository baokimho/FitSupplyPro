import { readFileSync, readdirSync } from "node:fs";
import pg from "pg";
import { expect, it } from "vitest";
import { requireTestDatabaseUrl } from "@shared/utils";

it("adds Sagas to Phase 7 orders without guessing incomplete compensation or changing synchronous orders", async () => {
  const pool = new pg.Pool({ connectionString: requireTestDatabaseUrl("order_test_db") });
  const client = await pool.connect();
  const directory = new URL("../prisma/migrations/", import.meta.url);
  const sagaMigration = "20261012010000_checkout_saga";
  const migration = (name: string) => readFileSync(new URL(`${name}/migration.sql`, directory), "utf8");
  try {
    await client.query("BEGIN");
    await client.query('CREATE SCHEMA checkout_saga_upgrade_test');
    await client.query('SET LOCAL search_path TO checkout_saga_upgrade_test');
    for (const name of readdirSync(directory).filter((name) => name < sagaMigration).sort()) {
      if (name !== "migration_lock.toml") await client.query(migration(name));
    }
    await client.query(`INSERT INTO "Order" ("id", "userId", "totalAmount", "status", "eventDriven", "creationEvent", "updatedAt")
      VALUES ('paid', 'user-1', 10, 'CONFIRMED', true, '{"correlationId":"paid-correlation"}', NOW()),
        ('pending', 'user-1', 10, 'PENDING', true, '{"correlationId":"pending-correlation"}', NOW()),
        ('cancelled', 'user-1', 10, 'CANCELLED', true, '{"correlationId":"cancelled-correlation"}', NOW()),
        ('sync', 'user-1', 10, 'PENDING', false, NULL, NOW())`);
    await client.query(migration(sagaMigration));
    const rows = await client.query('SELECT "orderId", "state"::text, "inventoryReserved", "inventoryReleased", "paymentOutcome", "failedStep" FROM "CheckoutSaga" ORDER BY "orderId"');
    expect(rows.rows).toEqual([
      { orderId: "cancelled", state: "FAILED", inventoryReserved: false, inventoryReleased: false, paymentOutcome: null, failedStep: "LEGACY" },
      { orderId: "paid", state: "COMPLETED", inventoryReserved: true, inventoryReleased: false, paymentOutcome: "SUCCEEDED", failedStep: null },
      { orderId: "pending", state: "FAILED", inventoryReserved: false, inventoryReleased: false, paymentOutcome: null, failedStep: "LEGACY" },
    ]);
    expect((await client.query('SELECT count(*)::int AS count FROM "Order"')).rows).toEqual([{ count: 4 }]);
    await expect(client.query(`INSERT INTO "CheckoutSaga" ("id", "orderId", "correlationId", "updatedAt") VALUES ('duplicate', 'paid', 'paid-correlation', NOW())`)).rejects.toMatchObject({ code: "23505" });
  } finally {
    await client.query("ROLLBACK");
    client.release();
    await pool.end();
  }
});
