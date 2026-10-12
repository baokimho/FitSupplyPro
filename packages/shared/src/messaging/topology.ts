import type { Channel } from "amqplib";

export const DOMAIN_EXCHANGE = "domain.events";
export const DEAD_LETTER_EXCHANGE = "domain.events.dlx";
export const DOMAIN_ROUTING_KEYS = [
  "order.created", "inventory.reserved", "inventory.reservation_failed",
  "payment.succeeded", "payment.failed", "order.confirmed", "order.cancelled",
  "inventory.released",
  "checkout.payment_requested", "checkout.refund_requested", "payment.refunded", "payment.refund_failed", "inventory.release_failed",
] as const;

export const DOMAIN_QUEUES = [
  { name: "inventory.order-created", bindings: ["order.created", "order.cancelled"] },
  { name: "payment.inventory-reserved", bindings: ["checkout.payment_requested", "checkout.refund_requested"] },
  { name: "order.payment-events", bindings: ["inventory.reserved", "payment.succeeded", "payment.failed", "inventory.reservation_failed", "inventory.released", "payment.refunded", "payment.refund_failed", "inventory.release_failed"] },
  { name: "notification.order-events", bindings: ["order.confirmed", "order.cancelled"] },
] as const;

/** Compatible declarations are idempotent. Each service owns its queue and DLQ. */
export async function declareRabbitMqTopology(channel: Channel): Promise<void> {
  await channel.assertExchange(DOMAIN_EXCHANGE, "topic", { durable: true });
  await channel.assertExchange(DEAD_LETTER_EXCHANGE, "direct", { durable: true });
  // Remove Phase 7's direct Payment trigger before enabling coordinated workers.
  await channel.assertQueue("payment.inventory-reserved", {
    durable: true, deadLetterExchange: DEAD_LETTER_EXCHANGE, deadLetterRoutingKey: "payment.inventory-reserved",
  });
  await channel.unbindQueue("payment.inventory-reserved", DOMAIN_EXCHANGE, "inventory.reserved");
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
