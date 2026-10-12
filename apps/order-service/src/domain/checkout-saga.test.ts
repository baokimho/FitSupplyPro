import { describe, expect, it } from "vitest";
import { classifySagaEvent } from "./checkout-saga.js";
import type { CheckoutSagaState } from "../generated/prisma/index.js";
import type { EventType } from "@shared/utils";

describe("Saga workflow policy", () => {
  it.each<[{ state: CheckoutSagaState; inventoryReserved?: boolean; inventoryReleased?: boolean; paymentOutcome?: string; failedStep?: string }, EventType, string]>([
    [{ state: "RESERVING" }, "inventory.reserved", "transition"],
    [{ state: "PAYING", inventoryReserved: true }, "inventory.reserved", "replay"],
    [{ state: "PAYING", inventoryReserved: true }, "inventory.reservation_failed", "conflict"],
    [{ state: "CANCELLED" }, "inventory.reserved", "stale"],
    [{ state: "PAYING", inventoryReserved: true }, "payment.succeeded", "transition"],
    [{ state: "CONFIRMING", paymentOutcome: "SUCCEEDED" }, "payment.failed", "conflict"],
    [{ state: "RELEASING", paymentOutcome: "FAILED" }, "payment.succeeded", "conflict"],
    [{ state: "COMPLETED", inventoryReserved: true, paymentOutcome: "SUCCEEDED" }, "payment.succeeded", "replay"],
    [{ state: "COMPENSATED", inventoryReserved: true, paymentOutcome: "REFUNDED" }, "payment.succeeded", "stale"],
    [{ state: "CANCELLED", inventoryReserved: true }, "payment.succeeded", "transition"],
    [{ state: "CANCELLED" }, "payment.succeeded", "conflict"],
    [{ state: "REFUNDING", inventoryReserved: true }, "inventory.released", "transition"],
    [{ state: "FAILED", failedStep: "REFUND" }, "payment.refunded", "transition"],
    [{ state: "FAILED", failedStep: "RELEASE", inventoryReserved: true }, "inventory.released", "transition"],
    [{ state: "COMPLETED" }, "inventory.release_failed", "stale"],
    [{ state: "COMPENSATED", inventoryReleased: true }, "inventory.released", "replay"],
  ])("classifies %j / %s as %s", (progress, event, expected) => {
    expect(classifySagaEvent({ inventoryReserved: false, inventoryReleased: false, paymentOutcome: null, failedStep: null, ...progress }, event)).toBe(expected);
  });
});
