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

export function readCheckoutConfig(env: NodeJS.ProcessEnv) {
  const flag = env.EVENT_DRIVEN_CHECKOUT ?? "false";
  if (flag !== "true" && flag !== "false") throw new Error("EVENT_DRIVEN_CHECKOUT must be true or false");
  return { enabled: flag === "true", broker: flag === "true" ? readRabbitMqConfig(env) : undefined };
}

export interface CheckoutEventTransaction {
  $queryRaw(query: TemplateStringsArray, ...values: string[]): Promise<unknown>;
  checkoutEvent: {
    findUnique(args: { where: { eventId: string } }): Promise<{ fingerprint: string; result: string | null } | null>;
    create(args: { data: { eventId: string; fingerprint: string; result: string | null } }): Promise<unknown>;
  };
}

/** Minimal incoming receipt; caller owns transaction. No polling/publication worker. */
export async function processCheckoutEvent<T extends CheckoutEventTransaction>(
  tx: T, event: KnownIntegrationEvent, work: (tx: T) => Promise<KnownIntegrationEvent | null>,
): Promise<KnownIntegrationEvent | null> {
  const fingerprint = createHash("sha256").update(serializeIntegrationEvent(event)).digest("hex");
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`checkout.event:${event.eventId}`}, 0))`;
  const receipt = await tx.checkoutEvent.findUnique({ where: { eventId: event.eventId } });
  if (receipt) {
    if (receipt.fingerprint !== fingerprint) throw new ConflictError("Event ID reused with different content");
    return receipt.result === null ? null : deserializeIntegrationEvent(receipt.result);
  }
  const result = await work(tx);
  await tx.checkoutEvent.create({ data: {
    eventId: event.eventId, fingerprint, result: result === null ? null : serializeIntegrationEvent(result).toString("utf8"),
  } });
  return result;
}

export type CheckoutHandler = (event: KnownIntegrationEvent) => Promise<KnownIntegrationEvent | null>;
export type CheckoutPublisher = (event: KnownIntegrationEvent) => Promise<void>;

export function checkoutMessageHandler(types: readonly EventType[], handler: CheckoutHandler, publish: CheckoutPublisher, logger: Logger) {
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
          if (permanent || attempt === 3) throw err;
          await delay(100 * attempt);
        }
      }
    });
  };
}

/** Phase 5 settles only after validated work plus confirmed publication completes. */
export async function startCheckoutMessaging(config: RabbitMqConfig, logger: Logger, queue: string, types: readonly EventType[], handler: CheckoutHandler) {
  const broker = await openRabbitMq(config, logger);
  try {
    const topology = await broker.createChannel();
    await declareRabbitMqTopology(topology);
    await topology.close();
    const publisher = await broker.createPublisher();
    const publish: CheckoutPublisher = (event) => publisher.publish(DOMAIN_EXCHANGE, event.eventType, serializeIntegrationEvent(event));
    const process = checkoutMessageHandler(types, handler, publish, logger);
    await broker.subscribe(queue, (message) => process(message.content));
    return { publish, isReady: broker.isReady, close: broker.close };
  } catch (err) {
    await broker.close();
    throw err;
  }
}
