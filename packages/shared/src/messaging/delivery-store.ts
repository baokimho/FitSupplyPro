import { serializeIntegrationEvent } from "../events/boundary.js";
import type { KnownIntegrationEvent } from "../events/registry.js";
import { ConflictError } from "../errors/httpErrors.js";
import { DeliveryBudgetExhausted, messageKey } from "./delivery-policy.js";

type DeliveryKey = { consumer: string; messageKey: string; replayCount: number };
export interface DeliveryTransaction {
  $queryRaw<T>(query: TemplateStringsArray, ...values: (string | number)[]): Promise<T>;
  checkoutEvent: { findUnique(args: { where: { eventId: string } }): Promise<{ fingerprint: string } | null> };
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
    // Native upsert avoids ORM read/create races on the first concurrent delivery.
    const [row] = await tx.$queryRaw<Array<{ attempts: number }>>`
      INSERT INTO "ConsumerDelivery" ("consumer", "messageKey", "replayCount", "attempts", "updatedAt")
      VALUES (${key.consumer}, ${key.messageKey}, ${key.replayCount}, 1, NOW())
      ON CONFLICT ("consumer", "messageKey", "replayCount") DO UPDATE
      SET "attempts" = "ConsumerDelivery"."attempts" + 1, "updatedAt" = NOW()
      WHERE "ConsumerDelivery"."attempts" < ${maxAttempts}
      RETURNING "attempts"`;
    if (!row) throw new DeliveryBudgetExhausted();
    return row.attempts;
  });
}
