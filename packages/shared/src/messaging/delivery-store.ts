import { serializeIntegrationEvent } from "../events/boundary.js";
import type { KnownIntegrationEvent } from "../events/registry.js";
import { ConflictError } from "../errors/httpErrors.js";
import { DeliveryBudgetExhausted, messageKey } from "./delivery-policy.js";

type DeliveryKey = { consumer: string; messageKey: string; replayCount: number };
export interface DeliveryTransaction {
  checkoutEvent: { findUnique(args: { where: { eventId: string } }): Promise<{ fingerprint: string } | null> };
  consumerDelivery: {
    upsert(args: { where: { consumer_messageKey_replayCount: DeliveryKey }; create: DeliveryKey; update: Record<string, never> }): Promise<unknown>;
    update(args: { where: { consumer_messageKey_replayCount: DeliveryKey; attempts: { lt: number } }; data: { attempts: { increment: number } } }): Promise<{ attempts: number }>;
  };
}
export interface DeliveryDatabase {
  $transaction<T>(work: (tx: DeliveryTransaction) => Promise<T>): Promise<T>;
}

/** Separate committed operational claim, never a successful Inbox receipt. */
export async function claimDeliveryAttempt(database: DeliveryDatabase, key: DeliveryKey, event: KnownIntegrationEvent, maxAttempts: number): Promise<number | null> {
  return database.$transaction(async (tx) => {
    const receipt = await tx.checkoutEvent.findUnique({ where: { eventId: event.eventId } });
    if (receipt) {
      if (receipt.fingerprint !== messageKey(serializeIntegrationEvent(event))) throw new ConflictError("Event ID reused with different content");
      return null; // Committed duplicate can ACK even after last permitted attempt.
    }
    await tx.consumerDelivery.upsert({ where: { consumer_messageKey_replayCount: key }, create: key, update: {} });
    try {
      const row = await tx.consumerDelivery.update({ where: { consumer_messageKey_replayCount: key, attempts: { lt: maxAttempts } }, data: { attempts: { increment: 1 } } });
      return row.attempts;
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") throw new DeliveryBudgetExhausted();
      throw error;
    }
  });
}
