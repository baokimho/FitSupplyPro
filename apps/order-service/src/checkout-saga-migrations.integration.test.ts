import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { expect, it } from "vitest";
import { requireTestDatabaseUrl, createIntegrationEvent, serializeIntegrationEvent } from "@shared/utils";

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

it("backfills retained roots and receipt outputs with original event identities into pending Outbox", async () => {
  const pool = new pg.Pool({ connectionString: requireTestDatabaseUrl("order_test_db") });
  const client = await pool.connect();
  const directory = new URL("../prisma/migrations/", import.meta.url);
  const name = "20261013010000_transactional_outbox";
  const migration = (entry: string) => readFileSync(new URL(`${entry}/migration.sql`, directory), "utf8");
  const items = [{ productId: randomUUID(), quantity: 1 }];
  const root = createIntegrationEvent({ eventType: "order.created", correlationId: randomUUID(), causationId: null,
    data: { orderId: randomUUID(), userId: "user", items, totalAmount: "10.00", currency: "USD" } });
  const result = createIntegrationEvent({ eventType: "checkout.payment_requested", correlationId: root.correlationId, causationId: root.eventId,
    data: { orderId: root.data.orderId, reservations: items } });
  try {
    await client.query("BEGIN");
    await client.query('CREATE SCHEMA checkout_outbox_upgrade_test');
    await client.query('SET LOCAL search_path TO checkout_outbox_upgrade_test');
    for (const entry of readdirSync(directory).filter((entry) => entry < name).sort()) await client.query(migration(entry));
    await client.query(`INSERT INTO "Order" ("id","userId","totalAmount","eventDriven","creationEvent","updatedAt") VALUES ($1,'user',10,true,$2,NOW())`,
      [root.data.orderId, serializeIntegrationEvent(root).toString("utf8")]);
    await client.query(`INSERT INTO "CheckoutEvent" ("eventId","fingerprint","result") VALUES ($1,'legacy-fingerprint',$2)`,
      [root.eventId, serializeIntegrationEvent(result).toString("utf8")]);
    await client.query(migration(name));
    const rows = await client.query('SELECT "eventId", "payload", "publishedAt", "attempts" FROM "OutboxEvent"');
    expect(rows.rows).toHaveLength(2);
    for (const event of [root, result]) expect(rows.rows).toContainEqual({ eventId: event.eventId, payload: serializeIntegrationEvent(event).toString("utf8"), publishedAt: null, attempts: 0 });
    expect((await client.query('SELECT "status"::text FROM "Order"')).rows).toEqual([{ status: "PENDING" }]);
  } finally {
    await client.query("ROLLBACK");
    client.release();
    await pool.end();
  }
});
