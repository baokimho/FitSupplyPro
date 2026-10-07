import { describe, expect, it } from "vitest";
import { OrderStatus } from "../generated/prisma/index.js";
import { assertOrderTransition, canTransitionOrder } from "./order-lifecycle.js";

const allowed = new Set([
  "PENDING:CONFIRMED", "PENDING:CANCELLED", "CONFIRMED:PROCESSING",
  "CONFIRMED:CANCELLED", "PROCESSING:SHIPPED", "SHIPPED:DELIVERED",
]);

describe("order lifecycle", () => {
  for (const from of Object.values(OrderStatus)) {
    for (const to of Object.values(OrderStatus)) {
      it(`${from} -> ${to}`, () => {
        const valid = allowed.has(`${from}:${to}`);
        expect(canTransitionOrder(from, to)).toBe(valid);
        if (valid) {
          expect(() => assertOrderTransition(from, to)).not.toThrow();
        } else {
          expect(() => assertOrderTransition(from, to)).toThrow(expect.objectContaining({
            status: 409, code: "INVALID_ORDER_TRANSITION", details: { fromStatus: from, toStatus: to },
          }));
        }
      });
    }
  }
});
