import { randomUUID } from "node:crypto";
import type { Channel, ConsumeMessage } from "amqplib";
import type { Logger } from "../logging/logger.js";
import { runWithCorrelation, validCorrelationId } from "../http/correlation.js";

export type RabbitMqHandler = (message: ConsumeMessage) => Promise<void>;
const CONSUMER_DRAIN_TIMEOUT_MS = 3000;

/** Dedicated channel per subscription; failed processing dead-letters, never poison-requeues. */
export async function consumeRabbitMq(
  channel: Channel, queue: string, handler: RabbitMqHandler, logger: Logger, prefetch = 10,
) {
  if (!Number.isInteger(prefetch) || prefetch < 1 || prefetch > 65535) {
    throw new Error("Consumer prefetch must be an integer from 1 to 65535");
  }
  let open = true;
  let stopping = false;
  let pendingStop: Promise<void> | undefined;
  const inFlight = new Set<Promise<void>>();
  channel.on("close", () => { open = false; });
  await channel.prefetch(prefetch);
  const { consumerTag } = await channel.consume(queue, (message) => {
    if (!message) {
      logger.error({ queue }, "broker cancelled consumer");
      return;
    }
    if (stopping) { if (open) channel.nack(message, false, true); return; }
    const headers = message.properties.headers ?? {};
    const correlation = {
      requestId: validCorrelationId(headers["x-request-id"]) ? headers["x-request-id"] : randomUUID(),
      traceId: validCorrelationId(headers["x-trace-id"]) ? headers["x-trace-id"] : randomUUID(),
    };
    const work = runWithCorrelation(correlation, async () => {
      const context = { queue, routingKey: message.fields.routingKey, redelivered: message.fields.redelivered };
      try {
        await handler(message);
        if (open) { channel.ack(message); logger.debug(context, "broker message acknowledged"); }
      } catch (err) {
        logger.error({ ...context, err }, "broker processing failed; rejecting without requeue");
        if (open) channel.nack(message, false, false);
      }
    }).catch((err: unknown) => logger.error({ ...correlation, queue, err }, "broker settlement failed"));
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
  return { stop };
}
