import { createHash, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { ConflictError, HttpError } from "../errors/httpErrors.js";
import { deserializeIntegrationEvent, IntegrationEventError, serializeIntegrationEvent } from "../events/boundary.js";
import type { EventType, KnownIntegrationEvent } from "../events/registry.js";
import { runWithCorrelation } from "../http/correlation.js";
import type { Logger } from "../logging/logger.js";
import { openRabbitMq } from "./broker.js";
import { readRabbitMqConfig, type RabbitMqConfig } from "./config.js";
import { declareRabbitMqTopology, DOMAIN_EXCHANGE } from "./topology.js";
import { enqueueOutboxEvent, startOutboxPublisher, type OutboxDatabase, type OutboxStore } from "./outbox.js";

export function readCheckoutConfig(env: NodeJS.ProcessEnv) {
  const flag = env.EVENT_DRIVEN_CHECKOUT ?? "false";
  if (flag !== "true" && flag !== "false") throw new Error("EVENT_DRIVEN_CHECKOUT must be true or false");
  return { enabled: flag === "true", broker: flag === "true" ? readRabbitMqConfig(env) : undefined };
}

export interface CheckoutEventTransaction {
  outboxEvent?: OutboxStore["outboxEvent"];
  $queryRaw(query: TemplateStringsArray, ...values: string[]): Promise<unknown>;
  checkoutEvent: {
    findUnique(args: { where: { eventId: string } }): Promise<{ fingerprint: string; result: string | null } | null>;
    create(args: { data: { eventId: string; eventType: string; fingerprint: string; result: string | null } }): Promise<unknown>;
  };
}

/** Service-local Inbox; caller owns the transaction containing effects and Outbox. */
export async function processCheckoutEvent<T extends CheckoutEventTransaction>(
  tx: T, event: KnownIntegrationEvent, work: (tx: T) => Promise<KnownIntegrationEvent | null>, logger?: Logger,
): Promise<KnownIntegrationEvent | null> {
  const fingerprint = checkoutEventFingerprint(event);
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`checkout.event:${event.eventId}`}, 0))`;
  const receipt = await tx.checkoutEvent.findUnique({ where: { eventId: event.eventId } });
  if (receipt) {
    if (receipt.fingerprint !== fingerprint) throw new ConflictError("Event ID reused with different content");
    return receipt.result === null ? null : deserializeIntegrationEvent(receipt.result);
  }
  const result = await work(tx);
  if (result && tx.outboxEvent) {
    await enqueueOutboxEvent({ outboxEvent: tx.outboxEvent }, result);
    logger?.info({ eventId: result.eventId, eventType: result.eventType, correlationId: result.correlationId }, "outbox intent staged with consumer transaction");
  }
  await tx.checkoutEvent.create({ data: {
    eventId: event.eventId, eventType: event.eventType, fingerprint, result: result === null ? null : serializeIntegrationEvent(result).toString("utf8"),
  } });
  return result;
}

export type CheckoutHandler = (event: KnownIntegrationEvent) => Promise<KnownIntegrationEvent | null>;
export type CheckoutPublisher = (event: KnownIntegrationEvent) => Promise<void>;
export type CheckoutFailureHandler = (event: KnownIntegrationEvent, error: unknown, retryable: boolean) => Promise<KnownIntegrationEvent | null>;

export function checkoutEventFingerprint(event: KnownIntegrationEvent) {
  return createHash("sha256").update(serializeIntegrationEvent(event)).digest("hex");
}

export function checkoutMessageHandler(types: readonly EventType[], handler: CheckoutHandler, publish: CheckoutPublisher, logger: Logger, onFailure?: CheckoutFailureHandler) {
  return async (content: Uint8Array) => {
    const event = deserializeIntegrationEvent(content);
    if (!types.includes(event.eventType)) throw new ConflictError("Unexpected checkout event type");
    const metadata = { eventId: event.eventId, eventType: event.eventType, eventVersion: event.eventVersion,
      correlationId: event.correlationId, causationId: event.causationId, producer: event.producer, orderId: event.data.orderId };
    return runWithCorrelation({ requestId: randomUUID(), traceId: event.correlationId }, async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await handler(event);
          if (result) await publish(result);
          logger.info({ ...metadata, attempt }, "checkout event completed; safe to acknowledge");
          return;
        } catch (err) {
          const permanent = err instanceof IntegrationEventError || (err instanceof HttpError && err.status < 500);
          logger.error({ ...metadata, attempt, permanent, err }, "checkout event processing failed");
          if (permanent || attempt === 3) {
            if (onFailure) {
              const failure = await onFailure(event, err, !permanent);
              if (failure) await publish(failure);
            }
            throw err;
          }
          await delay(100 * attempt);
        }
      }
    });
  };
}

/** Settlement waits for validated work and confirmed publication or durable intent. */
export async function startCheckoutMessaging(config: RabbitMqConfig, logger: Logger, queue: string, types: readonly EventType[], handler: CheckoutHandler, onFailure?: CheckoutFailureHandler, outbox?: OutboxDatabase) {
  const broker = await openRabbitMq(config, logger);
  try {
    const topology = await broker.createChannel();
    await declareRabbitMqTopology(topology);
    await topology.close();
    const publisher = await broker.createPublisher();
    const publish: CheckoutPublisher = (event) => publisher.publish(DOMAIN_EXCHANGE, event.eventType, serializeIntegrationEvent(event));
    const persist: CheckoutPublisher = outbox ? async (event) => {
      await outbox.$transaction((tx) => enqueueOutboxEvent(tx, event));
      logger.info({ eventId: event.eventId, eventType: event.eventType, correlationId: event.correlationId }, "outbox publication intent persisted");
    } : publish;
    const process = checkoutMessageHandler(types, handler, persist, logger, onFailure);
    await broker.subscribe(queue, (message) => process(message.content));
    const worker = outbox ? startOutboxPublisher(outbox, publish, logger) : undefined;
    return { publish, isReady: broker.isReady, stop: () => worker?.stop(), close: async () => { await worker?.close(); await broker.close(); } };
  } catch (err) {
    await broker.close();
    throw err;
  }
}

/** Reuse broker primitives; reconnect complete consumer/publisher session after loss. */
export async function startOutboxCheckoutMessaging(config: RabbitMqConfig, logger: Logger, queue: string, types: readonly EventType[], handler: CheckoutHandler, database: OutboxDatabase, onFailure?: CheckoutFailureHandler) {
  const connect = () => startCheckoutMessaging(config, logger, queue, types, handler, onFailure, database);
  let session = await connect();
  let stopped = false;
  let reconnecting = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let current: Promise<void> = Promise.resolve();
  const monitor = () => {
    if (stopped) return;
    current = (async () => {
      if (!session.isReady()) {
        reconnecting = true;
        try {
          await session.close().catch((err: unknown) => logger.warn({ err }, "closing unavailable checkout session"));
          if (!stopped) { session = await connect(); logger.info("checkout messaging recovered; pending outbox resumes"); }
        } catch (err) { logger.error({ err }, "checkout reconnect failed; retry scheduled"); }
        finally { reconnecting = false; }
      }
      if (!stopped) timer = setTimeout(monitor, 1000);
    })();
  };
  const stop = () => { stopped = true; clearTimeout(timer); session.stop(); };
  timer = setTimeout(monitor, 1000);
  return { stop, isReady: () => !stopped && !reconnecting && session.isReady(),
    close: async () => { stop(); await current; await session.close(); } };
}
