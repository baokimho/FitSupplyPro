import { readFileSync } from "node:fs";
import pg from "pg";
import { expect, it } from "vitest";
import { requireTestDatabaseUrl } from "@shared/utils";

const databaseUrl = requireTestDatabaseUrl("payment_test_db");
const migration = (name: string) => readFileSync(new URL(`../prisma/migrations/${name}/migration.sql`, import.meta.url), "utf8");

it("upgrades Phase 3 payment records and replay bodies without resetting attempts", async () => {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query('CREATE SCHEMA payment_migration_upgrade_test');
    await client.query('SET LOCAL search_path TO payment_migration_upgrade_test');
    await client.query(migration("20260705000000_init"));
    await client.query(migration("20260726030000_add_payment_idempotency"));
    await client.query(`INSERT INTO "Payment" ("id", "userId", "orderId", "amount", "status", "updatedAt")
      VALUES ('legacy-paid', 'user-1', 'paid-order', 19.99, 'PAID', NOW()),
      ('legacy-cancelled', 'user-1', 'cancelled-order', 25.50, 'CANCELLED', NOW())`);
    for (const [id, status, amount] of [["legacy-paid", "PAID", 19.99], ["legacy-cancelled", "CANCELLED", 25.50]]) {
      await client.query(`INSERT INTO "PaymentIdempotency"
        ("id", "userId", "action", "idempotencyKey", "requestFingerprint", "status", "paymentId", "responseBody", "updatedAt")
        VALUES ($1, 'user-1', 'payment.create', $1, 'fingerprint', 'COMPLETED', $1, $2::jsonb, NOW())`,
      [id, JSON.stringify({ id, status, amount })]);
    }
    for (const name of ["20261008000000_payment_domain", "20261008000100_fake_provider", "20261008000200_payment_attempts"]) {
      await client.query(migration(name));
    }
    const rows = await client.query('SELECT "id", "status"::text, "amount"::text FROM "Payment" ORDER BY "id"');
    expect(rows.rows).toEqual([
      { id: "legacy-cancelled", status: "FAILED", amount: "25.50" },
      { id: "legacy-paid", status: "SUCCEEDED", amount: "19.99" },
    ]);
    const replays = await client.query('SELECT "responseBody" FROM "PaymentIdempotency" ORDER BY "id"');
    expect(replays.rows.map((row: { responseBody: unknown }) => row.responseBody)).toEqual([
      { id: "legacy-cancelled", status: "FAILED", amount: "25.50" },
      { id: "legacy-paid", status: "SUCCEEDED", amount: "19.99" },
    ]);
    await client.query(`INSERT INTO "Payment" ("id", "userId", "orderId", "amount", "updatedAt")
      VALUES ('fresh-attempt', 'user-1', 'cancelled-order', 25.50, NOW())`);
    await expect(client.query(`INSERT INTO "Payment" ("id", "userId", "orderId", "amount", "updatedAt")
      VALUES ('duplicate-charge', 'user-1', 'paid-order', 19.99, NOW())`)).rejects.toMatchObject({ code: "23505" });
  } finally {
    await client.query("ROLLBACK");
    client.release();
    await pool.end();
  }
});
