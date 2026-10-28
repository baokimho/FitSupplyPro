import { createHash, randomUUID } from "node:crypto";
import { EmailProviderError } from "../domain/notification.js";
import type { PrismaClient } from "../generated/prisma/index.js";

export interface EmailMessage {
  deliveryKey: string;
  recipientUserId: string;
  subject: string;
  text: string;
}
export interface EmailProvider {
  send(message: EmailMessage, signal: AbortSignal): Promise<{ messageId: string }>;
}

/** Safe local sink; no network delivery and no message content in logs/receipts. */
export class FakeEmailProvider implements EmailProvider {
  constructor(private readonly database: PrismaClient) {}

  async send(message: EmailMessage, signal: AbortSignal) {
    signal.throwIfAborted();
    const fingerprint = createHash("sha256").update(JSON.stringify(message)).digest("hex");
    const receipt = await this.database.fakeEmailReceipt.upsert({
      where: { deliveryKey: message.deliveryKey },
      create: { deliveryKey: message.deliveryKey, fingerprint, messageId: randomUUID() }, update: {},
    });
    if (receipt.fingerprint !== fingerprint) throw new EmailProviderError("PERMANENT");
    return { messageId: receipt.messageId };
  }
}
