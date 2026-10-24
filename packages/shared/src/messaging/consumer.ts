import { randomUUID } from "node:crypto";
import type { Channel, ConsumeMessage } from "amqplib";
import type { Logger } from "../logging/logger.js";
import { runWithCorrelation, validCorrelationId } from "../http/correlation.js";
import { dependencyShutdownSignal } from "../resilience/timeout.js";
import { classifyFailure } from "../resilience/failure.js";
import { beginSpan, telemetryContext, extractTrace, SpanKind, spanError, count, observe } from "../observability/telemetry.js";
import { deliveryEventIdentity, deliveryFailureClass, MAX_REPLAY_COUNT } from "./delivery-policy.js";
import { DOMAIN_QUEUES } from "./topology.js";

export type RabbitMqHandler = (message: ConsumeMessage) => Promise<void>;
export type RabbitMqFailureHandler = (message: ConsumeMessage, error: unknown) => Promise<void>;
const CONSUMER_DRAIN_TIMEOUT_MS = 3000;

/** Dedicated channel per subscription; failed processing dead-letters, never poison-requeues. */
export async function consumeRabbitMq(
  channel: Channel, queue: string, handler: RabbitMqHandler, logger: Logger, prefetch = 10, quarantine?: RabbitMqFailureHandler,
) {
  if (!Number.isInteger(prefetch) || prefetch < 1 || prefetch > 65535) {
    throw new Error("Consumer prefetch must be an integer from 1 to 65535");
  }
  let open = true;
  let stopping = false;
  let active = true;
  let pendingStop: Promise<void> | undefined;
  const inFlight = new Set<Promise<void>>();
  channel.on("close", () => { open = false; });
  await channel.prefetch(prefetch);
  const { consumerTag } = await channel.consume(queue, (message) => {
    if (!message) {
      active = false;
      logger.error({ queue }, "broker cancelled consumer");
      return;
    }
    if (stopping) { if (open) channel.nack(message, false, true); return; }
    const headers = message.properties.headers ?? {};
    const queueLabel = DOMAIN_QUEUES.some((entry) => entry.name === queue) ? queue : "other";
    const replayEpoch: unknown = headers["x-fitsupply-replay-count"];
    if (typeof replayEpoch === "number" && Number.isInteger(replayEpoch) && replayEpoch >= 1 && replayEpoch <= MAX_REPLAY_COUNT) count("dlq_replay_deliveries_total", { queue: queueLabel });
    const eventType = deliveryEventIdentity(message.content)?.eventType ?? "unknown";
    const current = beginSpan("rabbitmq consume", SpanKind.CONSUMER, { "messaging.system": "rabbitmq", "messaging.destination.name": queueLabel, "event.type": eventType }, extractTrace(headers));
    const started = performance.now();
    let result = "success";
    const correlation = {
      requestId: validCorrelationId(headers["x-request-id"]) ? headers["x-request-id"] : randomUUID(),
      traceId: validCorrelationId(headers["x-trace-id"]) ? headers["x-trace-id"] : randomUUID(),
    };
    const work = telemetryContext.with(current.context, () => runWithCorrelation(correlation, async () => {
      const context = { queue, routingKey: message.fields.routingKey, redelivered: message.fields.redelivered };
      try {
        await handler(message);
        if (open) { channel.ack(message); logger.debug(context, "broker message acknowledged"); }
      } catch (err) {
        if (dependencyShutdownSignal.aborted && classifyFailure(err) === "cancelled") {
          result = "cancelled";
          if (open) channel.nack(message, false, true);
          logger.info(context, "shutdown cancelled processing; delivery requeued");
          return;
        }
        result = "failure";
        const error_class = deliveryFailureClass(err);
        spanError(current.span, error_class);
        count("message_processing_failures_total", { event_type: eventType, queue: queueLabel, error_class });
        if (quarantine) {
          try {
            await quarantine(message, err);
            result = "quarantined";
            if (open) channel.ack(message);
          } catch {
            result = "quarantine_failed";
            logger.error(context, "DLQ publication unconfirmed; closing channel with source unacknowledged");
            if (open) { open = false; await channel.close(); }
          }
          return;
        }
        logger.error({ ...context, err }, "broker processing failed; rejecting without requeue");
        if (open) channel.nack(message, false, false);
      } finally {
        const labels = { event_type: eventType, queue: queueLabel, result };
        count("messages_consumed_total", labels);
        observe("message_processing_duration_seconds", (performance.now() - started) / 1000, labels);
        current.span.setAttribute("processing.result", result); current.span.end();
      }
    })).catch((err: unknown) => logger.error({ ...correlation, queue, err }, "broker settlement failed"));
    inFlight.add(work);
    void work.finally(() => { inFlight.delete(work); });
  }, { noAck: false });
  logger.info({ queue, prefetch }, "broker consumer started");

  function stop(): Promise<void> {
    if (pendingStop) return pendingStop;
    stopping = true;
    pendingStop = (async () => {
      let timer: NodeJS.Timeout | undefined;
      try {
        await Promise.race([
          (async () => {
            if (open) await channel.cancel(consumerTag);
            await Promise.all([...inFlight]);
          })(),
          new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => reject(new Error("Consumer drain timed out")), CONSUMER_DRAIN_TIMEOUT_MS);
          }),
        ]);
      } finally {
        if (timer) clearTimeout(timer);
        // Closing requeues unsettled deliveries. Late handler completion cannot ACK a closed channel.
        if (open) { open = false; await channel.close(); }
      }
      logger.info({ queue }, "broker consumer stopped");
    })();
    return pendingStop;
  }
  return { stop, isReady: () => open && active && !stopping };
}
