export type ProviderPayment = Readonly<{
  paymentId: string;
  idempotencyKey: string;
  amount: string;
  currency: string;
}>;

export type PaymentResult = Readonly<{
  status: "SUCCEEDED" | "FAILED";
  reference: string;
  failureCode?: string;
}>;

export type ProviderRefund = ProviderPayment & Readonly<{ providerPaymentId: string }>;

export interface PaymentProvider {
  readonly name: string;
  // Adapters must acknowledge/verify the provider outcome and deduplicate by key.
  // The fake adapter simulates it; a real adapter must verify it with its provider.
  settle(input: ProviderPayment, outcome: PaymentResult["status"]): Promise<PaymentResult>;
  refund(input: ProviderRefund): Promise<Readonly<{ reference: string }>>;
}
