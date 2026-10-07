import { describe, expect, it } from "vitest";
import { assertPaymentTransition, type PaymentState } from "./payment-lifecycle.js";

const states: PaymentState[] = ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"];

describe("payment lifecycle", () => {
  for (const current of states) {
    for (const target of states) {
      it(`${current} to ${target}`, () => {
        const allowed = current === target ||
          (current === "PENDING" && (target === "SUCCEEDED" || target === "FAILED")) ||
          (current === "SUCCEEDED" && target === "REFUNDED");
        if (allowed) expect(() => assertPaymentTransition(current, target)).not.toThrow();
        else expect(() => assertPaymentTransition(current, target)).toThrow("Invalid payment transition");
      });
    }
  }
});
