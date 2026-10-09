import type { Channel } from "amqplib";

export const DOMAIN_EXCHANGE = "domain.events";
export const DEAD_LETTER_EXCHANGE = "domain.events.dlx";
export const DOMAIN_ROUTING_KEYS = [
  "order.created", "inventory.reserved", "inventory.reservation_failed",
  "payment.succeeded", "payment.failed", "order.confirmed", "order.cancelled",
] as const;

export const DOMAIN_QUEUES = [
  { name: "inventory.order-created", bindings: ["order.created"] },
  { name: "payment.inventory-reserved", bindings: ["inventory.reserved"] },
  { name: "order.payment-events", bindings: ["payment.succeeded", "payment.failed"] },
  { name: "notification.order-events", bindings: ["order.confirmed", "order.cancelled"] },
] as const;

/** Compatible declarations are idempotent. Each service owns its queue and DLQ. */
export async function declareRabbitMqTopology(channel: Channel): Promise<void> {
  await channel.assertExchange(DOMAIN_EXCHANGE, "topic", { durable: true });
  await channel.assertExchange(DEAD_LETTER_EXCHANGE, "direct", { durable: true });
  for (const queue of DOMAIN_QUEUES) {
    await channel.assertQueue(`${queue.name}.dlq`, { durable: true });
    await channel.bindQueue(`${queue.name}.dlq`, DEAD_LETTER_EXCHANGE, queue.name);
    await channel.assertQueue(queue.name, {
      durable: true,
      deadLetterExchange: DEAD_LETTER_EXCHANGE,
      deadLetterRoutingKey: queue.name,
    });
    for (const key of queue.bindings) await channel.bindQueue(queue.name, DOMAIN_EXCHANGE, key);
  }
}
