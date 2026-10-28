import { processInboxEvent, traced, SpanKind, traceHeaders, type KnownIntegrationEvent, type Logger } from "@shared/utils";
import type { PrismaClient } from "../generated/prisma/index.js";
import { buildNotification } from "../domain/notification.js";

export async function acceptNotificationEvent(database: PrismaClient, event: KnownIntegrationEvent, logger: Logger) {
  const content = buildNotification(event);
  await traced("notification.consume", SpanKind.INTERNAL, { "event.type": event.eventType }, () =>
    traced("notification.persist", SpanKind.INTERNAL, {}, () => database.$transaction((tx) => processInboxEvent(tx, event, async () => {
      const notification = await tx.notification.create({ data: { ...content, sourceEventId: event.eventId,
        correlationId: event.correlationId, traceparent: traceHeaders().traceparent,
        deliveries: { create: { channel: "EMAIL" } } } });
      logger.info({ eventId: event.eventId, eventType: event.eventType, correlationId: event.correlationId,
        notificationId: notification.id, channel: "EMAIL", status: "PENDING" }, "notification acceptance staged");
      return null;
    }))));
}
