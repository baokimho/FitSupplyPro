import { ConflictError } from "@shared/utils";

export type PaymentState = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";

const transitions: Record<PaymentState, readonly PaymentState[]> = {
  PENDING: ["SUCCEEDED", "FAILED"],
  SUCCEEDED: ["REFUNDED"],
  FAILED: [],
  REFUNDED: [],
};

export function assertPaymentTransition(current: PaymentState, target: PaymentState): void {
  if (current === target) return;
  if (!transitions[current].includes(target)) {
    throw new ConflictError("Invalid payment transition", { current, target });
  }
}
