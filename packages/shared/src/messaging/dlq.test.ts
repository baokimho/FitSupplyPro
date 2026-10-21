import { expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { createIntegrationEvent, serializeIntegrationEvent } from "../events/boundary.js";
import { describeDlqMessage, replayDlqDelivery } from "./dlq.js";
import type { ConsumeMessage } from "amqplib";

const event = createIntegrationEvent({ eventType: "order.created", correlationId: randomUUID(), causationId: null,
  data: { orderId: randomUUID(), userId: "user", items: [{ productId: randomUUID(), quantity: 1 }], totalAmount: "1.00", currency: "USD" } });
const message = { content: serializeIntegrationEvent(event), fields: { routingKey: "inventory.order-created" }, properties: {} } as ConsumeMessage;

it("keeps immutable event summary visible when replay limit blocks replay", () => {
  const limited = { ...message, properties: { ...message.properties, headers: { "x-fitsupply-replay-count": 3 } } };
  expect(describeDlqMessage("inventory.order-created.dlq", limited)).toMatchObject({ replayEligible: false, replayCount: 3, event: { eventId: event.eventId } });
});
it("does not expose arbitrary transport diagnostics", () => {
  const poison = { ...message, content: Buffer.from("private-secret"), properties: { ...message.properties, headers: {
    "x-fitsupply-failure": '{"errorMessage":"private-secret", "stack":"private-secret", "errorCode":"private-secret"}',
  } } };
  expect(JSON.stringify(describeDlqMessage("inventory.order-created.dlq", poison))).not.toContain("private-secret");
});
it("refuses invalid/unsupported queue replay before publication or ACK", async () => {
  const ack = vi.fn(); const publish = vi.fn();
  await expect(replayDlqDelivery({ ack }, "other.dlq", message, publish)).rejects.toThrow("configured");
  await expect(replayDlqDelivery({ ack }, "inventory.order-created.dlq", { ...message, content: Buffer.from("bad") }, publish)).rejects.toThrow();
  expect(publish).not.toHaveBeenCalled(); expect(ack).not.toHaveBeenCalled();
});
