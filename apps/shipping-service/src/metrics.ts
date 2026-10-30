import { persistedCounter, registerTelemetryCollector, resetPersistedCounter, setGauge } from "@shared/utils";
import type { PrismaClient } from "./generated/prisma/index.js";

export function registerShippingMetrics(database: PrismaClient) {
  registerTelemetryCollector("shipping", async () => {
    const states = await database.shipment.groupBy({ by: ["status"], _count: true });
    resetPersistedCounter("shipments_created_total");
    persistedCounter("shipments_created_total", states.reduce((total, row) => total + row._count, 0));
    for (const status of ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const) {
      setGauge("shipping_shipments", states.find((row) => row.status === status)?._count ?? 0, ["status"], { status });
    }
    const [backlog] = await database.$queryRaw<Array<{ pending: bigint; age: number | null }>>`
      SELECT COUNT(*) AS pending, EXTRACT(EPOCH FROM (NOW() - MIN("createdAt")))::float8 AS age FROM "OutboxEvent" WHERE "publishedAt" IS NULL`;
    setGauge("outbox_pending_total", Number(backlog.pending));
    setGauge("outbox_oldest_pending_age_seconds", Math.max(0, backlog.age ?? 0));
    resetPersistedCounter("shipping_events_committed_total");
    for (const eventType of ["shipment.shipped", "shipment.delivered"]) {
      const [row] = await database.$queryRaw<Array<{ total: bigint }>>`SELECT COUNT(*) AS total FROM "OutboxEvent" WHERE "payload"::jsonb->>'eventType' = ${eventType}`;
      persistedCounter("shipping_events_committed_total", Number(row.total), ["event_type"], { event_type: eventType });
    }
  });
}
