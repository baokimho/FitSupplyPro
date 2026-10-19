import { randomUUID } from "node:crypto";
import { ConflictError } from "../errors/httpErrors.js";
import { deserializeIntegrationEvent, serializeIntegrationEvent } from "../events/boundary.js";
import type { KnownIntegrationEvent } from "../events/registry.js";
import { runWithCorrelation } from "../http/correlation.js";
import type { Logger } from "../logging/logger.js";
import { retryDelay } from "../resilience/retry.js";

type OutboxUpdate = { attempts?: { increment: number }; publishedAt?: Date; lastError?: string | null; nextAttemptAt?: Date };
export interface OutboxStore {
  outboxEvent: {
    findUnique(args: { where: { eventId: string } }): Promise<{ payload: string } | null>;
    upsert(args: { where: { deduplicationKey: string }; create: { eventId: string; deduplicationKey: string; payload: string }; update: Record<string, never> }): Promise<{ payload: string }>;
    update(args: { where: { id: string }; data: OutboxUpdate }): Promise<unknown>;
  };
}
export interface OutboxTransaction extends OutboxStore {
  $queryRaw<T = unknown>(query: TemplateStringsArray, ...values: string[]): Promise<T>;
}
export interface OutboxDatabase {
  $transaction<T>(work: (tx: OutboxTransaction) => Promise<T>, options?: { maxWait: number; timeout: number }): Promise<T>;
}

/** Caller owns business transaction. Key also recovers Payment result before receipt commit. */
export async function enqueueOutboxEvent(tx: OutboxStore, event: KnownIntegrationEvent, deduplicationKey = event.eventId): Promise<KnownIntegrationEvent> {
  const payload = serializeIntegrationEvent(event).toString("utf8");
  const existing = await tx.outboxEvent.findUnique({ where: { eventId: event.eventId } });
  if (existing) {
    if (existing.payload !== payload) throw new ConflictError("Outbox event ID reused with different content");
    return deserializeIntegrationEvent(existing.payload);
  }
  const row = await tx.outboxEvent.upsert({ where: { deduplicationKey }, create: { eventId: event.eventId, deduplicationKey, payload }, update: {} });
  const stored = deserializeIntegrationEvent(row.payload);
  // Replayed application work may construct fresh metadata; retain first logical event.
  const identity = ({ eventId: _id, occurredAt: _time, ...rest }: KnownIntegrationEvent) => rest;
  if (JSON.stringify(identity(stored)) !== JSON.stringify(identity(deserializeIntegrationEvent(payload)))) {
    throw new ConflictError("Outbox operation reused with different content");
  }
  return stored;
}

/** Dispatch transaction holds only an Outbox row, never the original domain transaction. */
export async function dispatchOutboxOnce(database: OutboxDatabase, publish: (event: KnownIntegrationEvent) => Promise<void>, logger: Logger): Promise<boolean> {
  return database.$transaction(async (tx) => {
    // Narrow raw SQL: Prisma has no SKIP LOCKED API. Separate workers claim distinct rows.
    const rows = await tx.$queryRaw<Array<{ id: string; payload: string; attempts: number }>>`
      SELECT "id", "payload", "attempts" FROM "OutboxEvent"
      WHERE "publishedAt" IS NULL AND "nextAttemptAt" <= NOW()
      ORDER BY "createdAt", "id" LIMIT 1 FOR UPDATE SKIP LOCKED`;
    const row = rows[0];
    if (!row) return false;
    const event = deserializeIntegrationEvent(row.payload);
    const metadata = { outboxId: row.id, eventId: event.eventId, eventType: event.eventType, correlationId: event.correlationId, attempt: row.attempts + 1 };
    await tx.outboxEvent.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    await runWithCorrelation({ requestId: randomUUID(), traceId: event.correlationId }, async () => {
      logger.info(metadata, "outbox dispatch attempt");
      try { await publish(event); }
      catch (err) {
        const retryDelayMs = retryDelay(row.attempts + 1, { baseDelayMs: 500, maxDelayMs: 30000 });
        await tx.outboxEvent.update({ where: { id: row.id }, data: { lastError: "Publication failed; inspect correlated dispatch log",
          nextAttemptAt: new Date(Date.now() + retryDelayMs) } });
        logger.warn({ ...metadata, retryDelayMs, dependency: "rabbitmq", operation: "publish", failureClass: "ambiguous", err }, "outbox dispatch failed; retry scheduled");
        return;
      }
      // If this write/commit fails, row remains pending and same envelope republishes.
      await tx.outboxEvent.update({ where: { id: row.id }, data: { publishedAt: new Date(), lastError: null } });
      logger.info(metadata, "outbox dispatch confirmed; published marker staged");
    });
    return true;
  }, { maxWait: 1000, timeout: 5000 });
}

export function startOutboxPublisher(database: OutboxDatabase, publish: (event: KnownIntegrationEvent) => Promise<void>, logger: Logger) {
  // ponytail: one row per dispatch; add service workers for higher throughput.
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let current: Promise<void> = Promise.resolve();
  const poll = () => {
    if (stopped) return;
    current = (async () => {
      let found = false;
      try { found = await dispatchOutboxOnce(database, publish, logger); }
      catch (err) { logger.error({ err }, "outbox dispatch transaction failed; pending intent retained"); }
      if (!stopped) timer = setTimeout(poll, found ? 0 : 500);
    })();
  };
  const stop = () => { stopped = true; clearTimeout(timer); };
  poll();
  return { stop, close: async () => { stop(); await current; } };
}
