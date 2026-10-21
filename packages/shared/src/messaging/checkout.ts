import { createHash, randomUUID } from "node:crypto";
import { ConflictError } from "../errors/httpErrors.js";
import { deserializeIntegrationEvent, serializeIntegrationEvent } from "../events/boundary.js";
import { retryOperation, retryDelay, type RetryPolicy } from "../resilience/retry.js";
import { readResilienceConfig } from "../resilience/config.js";
import { canRetry, classifyFailure } from "../resilience/failure.js";
import type { EventType, KnownIntegrationEvent } from "../events/registry.js";
import { runWithCorrelation } from "../http/correlation.js";
import type { Logger } from "../logging/logger.js";
import { openRabbitMq } from "./broker.js";
import { readRabbitMqConfig, type RabbitMqConfig } from "./config.js";
import { declareRabbitMqTopology, DOMAIN_EXCHANGE } from "./topology.js";
import { enqueueOutboxEvent, startOutboxPublisher, type OutboxDatabase, type OutboxStore } from "./outbox.js";
import { claimDeliveryAttempt, type DeliveryDatabase } from "./delivery-store.js";
import { DeliveryBudgetExhausted, DeliveryPoisonError, deliveryDiagnostic, deliveryErrorSummary, FAILURE_HEADER, messageKey, replayCount, REPLAY_COUNT_HEADER } from "./delivery-policy.js";
import { DEAD_LETTER_EXCHANGE } from "./topology.js";
import type { ConsumeMessage } from "amqplib";
import { dependencyShutdownSignal } from "../resilience/timeout.js";

export function readCheckoutConfig(env: NodeJS.ProcessEnv) {
  const flag = env.EVENT_DRIVEN_CHECKOUT ?? "false";
  if (flag !== "true" && flag !== "false") throw new Error("EVENT_DRIVEN_CHECKOUT must be true or false");
  if (flag === "true") readResilienceConfig(env);
  return { enabled: flag === "true", broker: flag === "true" ? readRabbitMqConfig(env) : undefined };
}

export interface CheckoutEventTransaction {
  outboxEvent: OutboxStore["outboxEvent"];
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
  if (result) {
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

export function checkoutMessageHandler(types: readonly EventType[], handler: CheckoutHandler, publish: CheckoutPublisher, logger: Logger, onFailure?: CheckoutFailureHandler, options?: { policy?: RetryPolicy; signal?: AbortSignal; beforeAttempt?: (event: KnownIntegrationEvent) => Promise<number | null> }) {
  return async (content: Uint8Array) => {
    const event = deserializeIntegrationEvent(content);
    if (!types.includes(event.eventType)) throw new DeliveryPoisonError();
    const metadata = { eventId: event.eventId, eventType: event.eventType, eventVersion: event.eventVersion,
      correlationId: event.correlationId, causationId: event.causationId, producer: event.producer, orderId: event.data.orderId };
    return runWithCorrelation({ requestId: randomUUID(), traceId: event.correlationId }, async () => {
      try {
        await retryOperation(async (attempt) => {
          const deliveryAttempt = await options?.beforeAttempt?.(event);
          (options?.signal ?? dependencyShutdownSignal).throwIfAborted();
          const result = await handler(event);
          if (result) await publish(result);
          logger.info({ ...metadata, attempt, deliveryAttempt }, "checkout event completed; safe to acknowledge");
        }, { ...(options?.policy ?? readResilienceConfig()), dependency: "checkout-handler", operation: event.eventType,
          safe: true, logger: logger.child(metadata), signal: options?.signal });
      } catch (err) {
        if (classifyFailure(err) === "cancelled") throw err;
        logger.error({ ...metadata, ...deliveryErrorSummary(err) }, "checkout event processing failed");
        if (onFailure) {
          const failure = await onFailure(event, err, err instanceof DeliveryBudgetExhausted || canRetry(err, true));
          if (failure) await publish(failure);
        }
        throw err;
      }
    });
  };
}

/** One budget across short retries and broker/process redelivery. */
export function createCheckoutDeliveryHandler(queue: string, types: readonly EventType[], handler: CheckoutHandler,
  persist: CheckoutPublisher, logger: Logger, database: DeliveryDatabase, onFailure?: CheckoutFailureHandler) {
  const policy = readResilienceConfig();
  const attempts = new WeakMap<ConsumeMessage, number>();
  return {
    handle: async (message: ConsumeMessage) => {
      const epoch = replayCount(message);
      const process = checkoutMessageHandler(types, handler, persist, logger, onFailure, { policy, beforeAttempt: async (event) => {
        try {
          const attempt = await claimDeliveryAttempt(database, { consumer: queue, messageKey: messageKey(message.content), replayCount: epoch }, event, policy.maxAttempts);
          if (attempt !== null) attempts.set(message, attempt);
          return attempt;
        } catch (error) {
          if (error instanceof DeliveryBudgetExhausted) attempts.set(message, policy.maxAttempts);
          throw error;
        }
      } });
      await process(message.content);
    },
    quarantine: async (message: ConsumeMessage, error: unknown, publish: (exchange: string, key: string, body: Buffer, headers: Record<string, unknown>) => Promise<void>) => {
      let epoch = 0;
      try { epoch = replayCount(message); } catch { epoch = 3; }
      const diagnostic = deliveryDiagnostic(queue, { ...message, properties: { ...message.properties, headers: { ...message.properties.headers, [REPLAY_COUNT_HEADER]: epoch } } }, error, attempts.get(message) ?? 0, policy.maxAttempts);
      logger.warn(diagnostic, "delivery quarantine pending confirmation");
      await publish(DEAD_LETTER_EXCHANGE, queue, message.content, {
        [FAILURE_HEADER]: JSON.stringify(diagnostic), [REPLAY_COUNT_HEADER]: epoch,
        "x-fitsupply-original-routing-key": diagnostic.routingKey,
      });
    },
  };
}

/** Settlement waits for validated work and confirmed publication or durable intent. */
export async function startCheckoutMessaging(config: RabbitMqConfig, logger: Logger, queue: string, types: readonly EventType[], handler: CheckoutHandler, onFailure: CheckoutFailureHandler | undefined, outbox: OutboxDatabase & DeliveryDatabase) {
  const broker = await openRabbitMq(config, logger);
  try {
    const topology = await broker.createChannel();
    await declareRabbitMqTopology(topology);
    await topology.close();
    const publisher = await broker.createPublisher();
    const publish: CheckoutPublisher = (event) => publisher.publish(DOMAIN_EXCHANGE, event.eventType, serializeIntegrationEvent(event));
    const persist: CheckoutPublisher = async (event) => {
      await outbox.$transaction((tx) => enqueueOutboxEvent(tx, event));
      logger.info({ eventId: event.eventId, eventType: event.eventType, correlationId: event.correlationId }, "outbox publication intent persisted");
    };
    const delivery = createCheckoutDeliveryHandler(queue, types, handler, persist, logger, outbox, onFailure);
    await broker.subscribe(queue, delivery.handle, 10, (message, error) => delivery.quarantine(message, error, publisher.publish));
    const worker = startOutboxPublisher(outbox, publish, logger);
    return { publish, isReady: broker.isReady, stop: worker.stop, close: async () => { await worker.close(); await broker.close(); } };
  } catch (err) {
    await broker.close();
    throw err;
  }
}

/** Reuse broker primitives; reconnect complete consumer/publisher session after loss. */
export async function startOutboxCheckoutMessaging(config: RabbitMqConfig, logger: Logger, queue: string, types: readonly EventType[], handler: CheckoutHandler, database: OutboxDatabase & DeliveryDatabase, onFailure?: CheckoutFailureHandler) {
  const connect = () => startCheckoutMessaging(config, logger, queue, types, handler, onFailure, database);
  let session = await connect();
  let stopped = false;
  let reconnecting = false;
  let failures = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let current: Promise<void> = Promise.resolve();
  const monitor = () => {
    if (stopped) return;
    current = (async () => {
      if (!session.isReady()) {
        reconnecting = true;
        try {
          await session.close().catch((err: unknown) => logger.warn({ err }, "closing unavailable checkout session"));
          if (!stopped) { session = await connect(); failures = 0; logger.info("checkout messaging recovered; pending outbox resumes"); }
        } catch (err) { failures++; logger.error({ err, attempt: failures, dependency: "rabbitmq", operation: "reconnect" }, "checkout reconnect failed; retry scheduled"); }
        finally { reconnecting = false; }
      }
      if (!stopped) timer = setTimeout(monitor, failures ? retryDelay(failures, { baseDelayMs: 1000, maxDelayMs: 30000 }) : 1000);
    })();
  };
  const stop = () => { stopped = true; clearTimeout(timer); session.stop(); };
  timer = setTimeout(monitor, 1000);
  return { stop, isReady: () => !stopped && !reconnecting && session.isReady(),
    close: async () => { stop(); await current; await session.close(); } };
}
