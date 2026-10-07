import { createHash } from "node:crypto";
import { ConflictError, ServiceUnavailableError } from "@shared/utils";
import type { PrismaClient } from "../generated/prisma/index.js";
import type { PaymentProvider, PaymentResult, ProviderPayment, ProviderRefund } from "./payment-provider.js";

export class FakePaymentProvider implements PaymentProvider {
  readonly name = "MOCK";

  constructor(private readonly database: PrismaClient) {}

  private async acknowledge(input: ProviderPayment, result: string, reference: string, providerPaymentId?: string) {
    const requestFingerprint = createHash("sha256").update(JSON.stringify({
      paymentId: input.paymentId, amount: input.amount, currency: input.currency, result, providerPaymentId,
    })).digest("hex");
    // This uses a separate committed connection, never the caller's transaction.
    await this.database.$executeRaw`
      INSERT INTO "FakeProviderOperation" ("idempotencyKey", "requestFingerprint", "result", "reference")
      VALUES (${input.idempotencyKey}, ${requestFingerprint}, ${result}, ${reference})
      ON CONFLICT DO NOTHING
    `;
    const receipt = await this.database.fakeProviderOperation.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (!receipt) throw new ConflictError("Provider reference already belongs to another operation");
    if (receipt.requestFingerprint !== requestFingerprint) {
      throw new ConflictError("Provider idempotency key was reused with a different request");
    }
    return receipt;
  }

  async settle(input: ProviderPayment, outcome: PaymentResult["status"]): Promise<PaymentResult> {
    const receipt = await this.acknowledge(input, outcome, `fake_payment_${input.paymentId}`);
    if (receipt.result !== "SUCCEEDED" && receipt.result !== "FAILED") {
      throw new ServiceUnavailableError("Invalid provider payment receipt");
    }
    return {
      status: receipt.result, reference: receipt.reference,
      ...(receipt.result === "FAILED" ? { failureCode: "FAKE_DECLINED" } : {}),
    };
  }

  async refund(input: ProviderRefund): Promise<{ reference: string }> {
    const payment = await this.database.fakeProviderOperation.findUnique({ where: { reference: input.providerPaymentId } });
    if (!payment || payment.result !== "SUCCEEDED") throw new ConflictError("Provider payment is not refundable");
    const originalFingerprint = createHash("sha256").update(JSON.stringify({
      paymentId: input.paymentId, amount: input.amount, currency: input.currency, result: "SUCCEEDED", providerPaymentId: undefined,
    })).digest("hex");
    if (payment.requestFingerprint !== originalFingerprint) throw new ConflictError("Refund differs from provider payment");
    const receipt = await this.acknowledge(input, "REFUNDED", `fake_refund_${input.paymentId}`, input.providerPaymentId);
    return { reference: receipt.reference };
  }
}
