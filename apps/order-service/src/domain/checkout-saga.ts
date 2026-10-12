import type { EventType } from "@shared/utils";
import type { CheckoutSaga } from "../generated/prisma/index.js";

export type SagaEventClassification = "transition" | "replay" | "stale" | "conflict";
/** Receipts deduplicate messages; this policy protects business workflow progress. */
export function classifySagaEvent(saga: Pick<CheckoutSaga, "state" | "inventoryReserved" | "inventoryReleased" | "paymentOutcome" | "failedStep">, type: EventType): SagaEventClassification {
  switch (type) {
    case "inventory.reserved":
      if (saga.inventoryReserved) return "replay";
      return saga.state === "RESERVING" ? "transition" : "stale";
    case "inventory.reservation_failed":
      if (saga.inventoryReserved) return "conflict";
      return saga.state === "RESERVING" ? "transition" : saga.state === "CANCELLED" ? "replay" : "stale";
    case "payment.succeeded":
      if (!saga.inventoryReserved) return "conflict";
      if (saga.paymentOutcome === "FAILED") return "conflict";
      if (saga.paymentOutcome === "REFUNDED") return "stale";
      if (saga.state === "COMPLETED") return "replay";
      return ["PAYING", "CONFIRMING", "REFUNDING", "CANCELLED", "COMPENSATED"].includes(saga.state) ||
        (saga.state === "FAILED" && saga.failedStep === "CONFIRMATION") ? "transition" : "conflict";
    case "payment.failed":
      if (saga.paymentOutcome === "SUCCEEDED" || saga.paymentOutcome === "REFUNDED") return "conflict";
      if (saga.paymentOutcome === "FAILED") return "replay";
      return saga.state === "PAYING" ? "transition" : "conflict";
    case "payment.refunded":
      if (saga.paymentOutcome === "REFUNDED" && saga.state !== "REFUNDING" && !(saga.state === "FAILED" && saga.failedStep === "RELEASE")) return "replay";
      if (saga.state === "FAILED" && saga.failedStep === "RELEASE" && saga.paymentOutcome === "REFUNDED") return "transition";
      return saga.state === "REFUNDING" || (saga.state === "FAILED" && saga.failedStep === "REFUND") ? "transition" : "conflict";
    case "inventory.released":
      if (saga.inventoryReleased) return "replay";
      return saga.inventoryReserved && (saga.state === "RELEASING" || saga.state === "REFUNDING" ||
        (saga.state === "FAILED" && ["REFUND", "RELEASE"].includes(saga.failedStep ?? ""))) ? "transition" : "conflict";
    case "payment.refund_failed":
      return saga.state === "REFUNDING" || (saga.state === "FAILED" && saga.failedStep === "REFUND") ? "transition" : "stale";
    case "inventory.release_failed":
      return saga.state === "RELEASING" || (saga.state === "FAILED" && saga.failedStep === "RELEASE") ? "transition" : "stale";
    case "order.cancelled": return "stale";
    default: return "conflict";
  }
}
