import { randomUUID } from "node:crypto";
import { traced, SpanKind, ROOT_CONTEXT, extractTrace, runWithCorrelation, activeSpanError, type Logger } from "@shared/utils";
import type { PrismaClient } from "../generated/prisma/index.js";
import type { EmailProvider } from "../providers/email-provider.js";
import { defaultEmailPolicy, deliveryFailureState, deliveryIdentity, EmailProviderError, type EmailDeliveryPolicy } from "../domain/notification.js";

const eventTypeByNotification: Record<string, string> = { ORDER_CONFIRMED: "order.confirmed", ORDER_CANCELLED: "order.cancelled", ORDER_SHIPPED: "shipment.shipped", ORDER_DELIVERED: "shipment.delivered" };

/** Committed claim consumes budget even if process dies before/after provider acceptance. */
export async function claimEmailDelivery(database: PrismaClient, policy = defaultEmailPolicy) {
  return database.$transaction(async (tx) => {
    const stale = await tx.$queryRaw<Array<{ id: string; attemptCount: number }>>`
      SELECT "id", "attemptCount" FROM "NotificationDelivery"
      WHERE "status" = 'SENDING' AND "claimExpiresAt" <= NOW()
      ORDER BY "claimExpiresAt", "id" LIMIT 1 FOR UPDATE SKIP LOCKED`;
    if (stale[0]) await tx.notificationDelivery.update({ where: { id: stale[0].id }, data: {
      status: stale[0].attemptCount >= policy.maxAttempts ? "FAILED" : "PENDING",
      lastError: "EMAIL_CLAIM_EXPIRED", claimToken: null, claimExpiresAt: null,
      nextAttemptAt: new Date(Date.now() + policy.baseDelayMs),
    } });
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "NotificationDelivery"
      WHERE "status" = 'PENDING' AND "nextAttemptAt" <= NOW()
      ORDER BY "createdAt", "id" LIMIT 1 FOR UPDATE SKIP LOCKED`;
    if (!rows[0]) return null;
    const row = await tx.notificationDelivery.findUniqueOrThrow({ where: { id: rows[0].id } });
    if (row.attemptCount >= policy.maxAttempts) {
      await tx.notificationDelivery.update({ where: { id: row.id }, data: { status: "FAILED", lastError: "EMAIL_ATTEMPTS_EXHAUSTED" } });
      return null;
    }
    return tx.notificationDelivery.update({ where: { id: row.id }, data: {
      status: "SENDING", attemptCount: { increment: 1 }, claimToken: randomUUID(), claimExpiresAt: new Date(Date.now() + policy.claimMs),
    } });
  });
}

/** Lock fences recovery and other senders; token fences a delayed former claim owner. */
export async function sendClaimedEmail(database: PrismaClient, claim: { id: string; claimToken: string | null }, provider: EmailProvider, logger: Logger, policy = defaultEmailPolicy) {
  return database.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "NotificationDelivery" WHERE "id" = ${claim.id}
      AND "status" = 'SENDING' AND "claimToken" = ${claim.claimToken}
      FOR UPDATE SKIP LOCKED`;
    if (!locked[0]) return false;
    const row = await tx.notificationDelivery.findUniqueOrThrow({ where: { id: claim.id }, include: { notification: true } });
    const notification = row.notification;
    const metadata = { eventId: notification.sourceEventId, eventType: eventTypeByNotification[notification.type] ?? "unknown", correlationId: notification.correlationId,
      notificationId: notification.id, deliveryId: row.id, channel: row.channel, attempt: row.attemptCount };
    await traced("notification.email.send", SpanKind.CLIENT, { channel: row.channel, attempt: row.attemptCount }, () =>
      runWithCorrelation({ requestId: randomUUID(), traceId: notification.correlationId ?? randomUUID() }, async () => {
        const controller = new AbortController();
        let timer: NodeJS.Timeout | undefined;
        let result: { messageId: string };
        try {
          result = await Promise.race([
            provider.send({ deliveryKey: deliveryIdentity(row.id), recipientUserId: notification.userId,
              subject: notification.title, text: notification.message }, controller.signal),
            new Promise<never>((_resolve, reject) => { timer = setTimeout(() => {
              controller.abort(); reject(new EmailProviderError("TIMEOUT"));
            }, policy.timeoutMs); }),
          ]);
        } catch (error) {
          activeSpanError("email_provider_failure");
          const failure = deliveryFailureState(error, row.attemptCount, policy);
          await tx.notificationDelivery.update({ where: { id: row.id }, data: { ...failure, claimToken: null, claimExpiresAt: null } });
          logger.warn({ ...metadata, status: failure.status, failureCode: failure.lastError }, "email delivery failed");
          return;
        } finally { clearTimeout(timer); }
        // Keep DB completion errors outside provider catch: rollback retains claim for recovery.
        await tx.notificationDelivery.update({ where: { id: row.id }, data: {
          status: "SENT", sentAt: new Date(), providerMessageId: result.messageId, lastError: null, claimToken: null, claimExpiresAt: null,
        } });
        logger.info({ ...metadata, status: "SENT" }, "email delivery completion staged");
      }), ROOT_CONTEXT, extractTrace({ traceparent: notification.traceparent }));
    return true;
  }, { maxWait: 1000, timeout: policy.timeoutMs + 2000 });
}

export async function deliverEmailOnce(database: PrismaClient, provider: EmailProvider, logger: Logger, policy = defaultEmailPolicy) {
  const claim = await claimEmailDelivery(database, policy);
  if (!claim) return false;
  await sendClaimedEmail(database, claim, provider, logger, policy);
  return true;
}

export function startEmailWorker(database: PrismaClient, provider: EmailProvider, logger: Logger, policy: EmailDeliveryPolicy = defaultEmailPolicy) {
  let stopped = false;
  let timer: NodeJS.Timeout | undefined;
  let current: Promise<void> = Promise.resolve();
  const poll = () => {
    if (stopped) return;
    current = (async () => {
      let found = false;
      try { found = await deliverEmailOnce(database, provider, logger, policy); }
      catch { logger.error({ failureCode: "EMAIL_WORKER_TRANSACTION_FAILED" }, "email work retained for recovery"); }
      if (!stopped) timer = setTimeout(poll, found ? 0 : policy.pollMs);
    })();
  };
  const stop = () => { stopped = true; clearTimeout(timer); };
  poll();
  return { stop, close: async () => { stop(); await current; } };
}
