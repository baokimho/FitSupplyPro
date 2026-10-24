import { registerTelemetryCollector, setGauge, persistedCounter, resetPersistedCounter } from "./telemetry.js";
import { integrationEventRegistry } from "../events/registry.js";

interface MetricsDatabase {
  $queryRaw<T>(query: TemplateStringsArray, ...values: string[]): Promise<T>;
}
const eventTypes = new Set<string>(integrationEventRegistry.map((schema) => schema.shape.eventType.value));
const eventLabel = (value: string) => eventTypes.has(value) ? value : "unknown";
const states = new Set(["RESERVING", "PAYING", "CONFIRMING", "REFUNDING", "RELEASING", "COMPLETED", "CANCELLED", "COMPENSATED", "FAILED"]);

/** Scrape persisted state, including delayed/locked rows; never infer backlog from a dispatch batch. */
export function registerCheckoutMetrics(database: MetricsDatabase, service: "order-service" | "inventory-service" | "payment-service") {
  // ponytail: ledger scans suit current volume; materialize committed aggregates if scrape budget is exceeded.
  registerTelemetryCollector("checkout", async () => {
    const backlog = await database.$queryRaw<Array<{ pending: bigint; age: number | null }>>`
      SELECT COUNT(*) AS pending, EXTRACT(EPOCH FROM (NOW() - MIN("createdAt")))::float8 AS age
      FROM "OutboxEvent" WHERE "publishedAt" IS NULL`;
    const inbox = await database.$queryRaw<Array<{ eventType: string; total: bigint }>>`
      SELECT COALESCE("eventType", 'unknown') AS "eventType", COUNT(*) AS total FROM "CheckoutEvent" GROUP BY "eventType"`;
    const events = await database.$queryRaw<Array<{ eventType: string; total: bigint }>>`
      SELECT "payload"::jsonb->>'eventType' AS "eventType", COUNT(*) AS total FROM "OutboxEvent" GROUP BY "payload"::jsonb->>'eventType'`;
    setGauge("outbox_pending_total", Number(backlog[0]?.pending ?? 0));
    setGauge("outbox_oldest_pending_age_seconds", Math.max(0, backlog[0]?.age ?? 0));
    resetPersistedCounter("inbox_processed_total");
    for (const row of inbox) persistedCounter("inbox_processed_total", Number(row.total), ["event_type"], { event_type: eventLabel(row.eventType) });
    resetPersistedCounter("business_events_committed_total");
    for (const row of events) persistedCounter("business_events_committed_total", Number(row.total), ["event_type"], { event_type: eventLabel(row.eventType) });
    if (service === "order-service") {
      const rows = await database.$queryRaw<Array<{ total: bigint }>>`SELECT COUNT(*) AS total FROM "Order"`;
      resetPersistedCounter("orders_created_total"); persistedCounter("orders_created_total", Number(rows[0]?.total ?? 0));
      const saga = await database.$queryRaw<Array<{ state: string; total: bigint }>>`SELECT "state", COUNT(*) AS total FROM "CheckoutSaga" GROUP BY "state"`;
      for (const state of states) setGauge("checkout_sagas", Number(saga.find((row) => row.state === state)?.total ?? 0), ["state"], { state });
    } else if (service === "payment-service") {
      const rows = await database.$queryRaw<Array<{ total: bigint }>>`SELECT COUNT(*) AS total FROM "Payment"`;
      resetPersistedCounter("payments_created_total"); persistedCounter("payments_created_total", Number(rows[0]?.total ?? 0));
    } else {
      const rows = await database.$queryRaw<Array<{ total: bigint }>>`SELECT COUNT(*) AS total FROM "InventoryOperation"`;
      resetPersistedCounter("inventory_operations_committed_total"); persistedCounter("inventory_operations_committed_total", Number(rows[0]?.total ?? 0));
    }
  });
}
