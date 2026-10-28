import { persistedCounter, registerTelemetryCollector, resetPersistedCounter, setGauge } from "@shared/utils";
import type { PrismaClient } from "./generated/prisma/index.js";

export function registerNotificationMetrics(database: PrismaClient) {
  registerTelemetryCollector("notification", async () => {
    const created = await database.notification.count({ where: { sourceEventId: { not: null } } });
    resetPersistedCounter("notifications_created_total"); persistedCounter("notifications_created_total", created);
    const groups = await database.notificationDelivery.groupBy({ by: ["status"], _count: true });
    resetPersistedCounter("notification_deliveries_total");
    for (const status of ["PENDING", "SENDING", "SENT", "FAILED"]) {
      const value = groups.find((row) => row.status === status)?._count ?? 0;
      setGauge("notification_deliveries", value, ["status"], { status });
      if (status === "SENT" || status === "FAILED") persistedCounter("notification_deliveries_total", value, ["status"], { status });
    }
    const rows = await database.$queryRaw<Array<{ pending: bigint; age: number | null; retries: bigint }>>`
      SELECT COUNT(*) FILTER (WHERE "status" IN ('PENDING', 'SENDING')) AS pending,
      EXTRACT(EPOCH FROM (NOW() - MIN("createdAt") FILTER (WHERE "status" IN ('PENDING', 'SENDING'))))::float8 AS age,
      COALESCE(SUM(GREATEST("attemptCount" - 1, 0)), 0)::bigint AS retries FROM "NotificationDelivery"`;
    setGauge("notification_delivery_pending", Number(rows[0]?.pending ?? 0));
    setGauge("notification_delivery_oldest_pending_age_seconds", Math.max(0, rows[0]?.age ?? 0));
    resetPersistedCounter("notification_delivery_retries_total"); persistedCounter("notification_delivery_retries_total", Number(rows[0]?.retries ?? 0));
  });
}
