import type { Channel } from "amqplib";
import type { openRabbitMq } from "./broker.js";
import { deserializeIntegrationEvent } from "../events/boundary.js";
import { DOMAIN_QUEUES } from "./topology.js";
import { count, traced, SpanKind, extractTrace } from "../observability/telemetry.js";
import { DELIVERY_FAILURE_MESSAGES, deliveryEventIdentity, FAILURE_HEADER, MAX_REPLAY_COUNT, quarantineId, replayCount, REPLAY_COUNT_HEADER, type DeliveryMessage, type DeliveryFailureClass } from "./delivery-policy.js";

export const MAX_DLQ_SCAN = 100;
type RecoveryBroker = Pick<Awaited<ReturnType<typeof openRabbitMq>>, "createChannel" | "createPublisher">;
export type ReplayPublisher = (exchange: string, route: string, content: Buffer, headers?: Record<string, unknown>) => Promise<void>;

function sourceQueue(dlq: string) {
  const queue = DOMAIN_QUEUES.find((entry) => `${entry.name}.dlq` === dlq);
  if (!queue) throw new Error("Queue must be a configured service DLQ");
  return queue;
}
function scanLimit(limit: number) {
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_DLQ_SCAN) throw new Error("Scan limit must be 1..100");
  return limit;
}
function replayEvent(dlq: string, message: DeliveryMessage) {
  const queue = sourceQueue(dlq);
  const event = deserializeIntegrationEvent(message.content);
  if (!(queue.bindings as readonly string[]).includes(event.eventType)) throw new Error("Event type is not handled by source queue");
  if (replayCount(message) >= MAX_REPLAY_COUNT) throw new Error("Replay limit reached; leave quarantined for explicit repair/reconciliation");
  return event;
}

/** Summary only: never echo arbitrary body, headers, failure text or stack. */
export function describeDlqMessage(dlq: string, message: DeliveryMessage) {
  const queue = sourceQueue(dlq);
  const event = deliveryEventIdentity(message.content);
  let eligible = true;
  try { replayEvent(dlq, message); } catch { eligible = false; }
  let count: number | null = null;
  try { count = replayCount(message); } catch { /* Invalid transport metadata is poison. */ }
  let diagnostic: Record<string, unknown> = {};
  const raw: unknown = message.properties.headers?.[FAILURE_HEADER];
  if (typeof raw === "string" && raw.length <= 8192) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) diagnostic = parsed as Record<string, unknown>;
    } catch { /* Legacy/native DLQ copies have no application diagnosis. */ }
  }
  const failureClass = ["TRANSIENT", "PERMANENT", "POISON"].includes(String(diagnostic.failureClass)) ? diagnostic.failureClass : "UNKNOWN";
  const numeric = (value: unknown) => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 5 ? value : null;
  const code = typeof diagnostic.errorCode === "string" && /^[A-Z0-9_.-]{1,80}$/.test(diagnostic.errorCode) ? diagnostic.errorCode : null;
  return { id: quarantineId(queue.name, message), dlq, sourceQueue: queue.name,
    routingKey: typeof diagnostic.routingKey === "string" && (queue.bindings as readonly string[]).includes(diagnostic.routingKey) ? diagnostic.routingKey : event?.eventType ?? null,
    event: event ? { eventId: event.eventId, eventType: event.eventType, eventVersion: event.eventVersion,
      correlationId: event.correlationId, causationId: event.causationId, producer: event.producer } : null,
    failureClass, errorCode: code, errorName: typeof diagnostic.errorName === "string" && /^[a-zA-Z0-9]{1,80}$/.test(diagnostic.errorName) ? diagnostic.errorName : null,
    errorMessage: failureClass === "UNKNOWN" ? "Legacy/native dead-letter; correlate service logs" : DELIVERY_FAILURE_MESSAGES[failureClass as DeliveryFailureClass],
    attempt: numeric(diagnostic.attempt), retryCount: numeric(diagnostic.retryCount), attemptsKnown: typeof diagnostic.attemptsKnown === "boolean" ? diagnostic.attemptsKnown : null,
    maxAttempts: numeric(diagnostic.maxAttempts),
    failedAt: typeof diagnostic.failedAt === "string" && /^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(diagnostic.failedAt) ? diagnostic.failedAt : null,
    replayCount: count, replayEligible: eligible,
    guidance: eligible ? "Fix root cause; replay requires explicit confirmation" : "Leave quarantined; invalid contract, route or replay limit requires deliberate repair/reconciliation" };
}

export async function inspectDlq(broker: RecoveryBroker, dlq: string, limit = 10) {
  sourceQueue(dlq); scanLimit(limit);
  const channel = await broker.createChannel();
  try {
    const records = [];
    for (let i = 0; i < limit; i++) {
      const message = await channel.get(dlq, { noAck: false });
      if (!message) break;
      records.push(describeDlqMessage(dlq, message));
    }
    return records;
  } finally { await channel.close(); } // Requeue every inspected delivery, never ACK.
}

/** Publisher confirmation precedes DLQ ACK. Uncertain outcome deliberately retains copy. */
export async function replayDlqDelivery(channel: Pick<Channel, "ack">, dlq: string, message: DeliveryMessage,
  publish: ReplayPublisher, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const event = replayEvent(dlq, message);
  const queue = sourceQueue(dlq);
  await traced("dlq replay", SpanKind.PRODUCER, { "messaging.destination.name": queue.name }, () => publish("", queue.name, message.content, {
    [REPLAY_COUNT_HEADER]: replayCount(message) + 1,
    "x-fitsupply-replayed-at": new Date().toISOString(),
    "x-fitsupply-original-routing-key": event.eventType,
    "x-trace-id": event.correlationId,
  }), extractTrace(message.properties.headers));
  signal?.throwIfAborted();
  // amqplib ACK only needs the original fields/deliveryTag; keep original delivery object.
  channel.ack(message);
  count("dlq_replays_total", { queue: queue.name });
}

export async function replayDlq(broker: RecoveryBroker, dlq: string, id: string, confirmation: string, limit = MAX_DLQ_SCAN, signal?: AbortSignal) {
  const queue = sourceQueue(dlq); scanLimit(limit);
  if (!/^[a-f0-9]{64}$/.test(id) || confirmation !== id) throw new Error("Replay requires --id and matching --confirm identifier");
  const channel = await broker.createChannel();
  try {
    for (let i = 0; i < limit; i++) {
      signal?.throwIfAborted();
      const message = await channel.get(dlq, { noAck: false });
      if (!message) break;
      if (quarantineId(queue.name, message) !== id) continue;
      const publisher = await broker.createPublisher();
      await replayDlqDelivery(channel, dlq, message, publisher.publish, signal);
      return { id, sourceQueue: queue.name, replayCount: replayCount(message) + 1 };
    }
    throw new Error("Selected message not found within bounded scan; no messages removed");
  } finally { await channel.close(); }
}
