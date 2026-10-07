import { ConflictError } from "@shared/utils";
import type { OrderStatus } from "../generated/prisma/index.js";

const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const canTransitionOrder = (from: OrderStatus, to: OrderStatus): boolean =>
  transitions[from].includes(to);

export function assertOrderTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransitionOrder(from, to)) {
    throw new ConflictError("Invalid order transition", { fromStatus: from, toStatus: to }, "INVALID_ORDER_TRANSITION");
  }
}
