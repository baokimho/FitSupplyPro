import { expect, it } from "vitest";
import { shipmentTransition } from "./shipment.js";
import { updateShipmentStatusSchema } from "../validations/shipping.schema.js";

it("preserves forward skips and cancellation before delivery", () => {
  expect(shipmentTransition({ status: "PROCESSING", trackingNumber: null }, { status: "DELIVERED", trackingNumber: "MANUAL-1" })).toEqual({ status: "DELIVERED", trackingNumber: "MANUAL-1", changed: true });
  expect(shipmentTransition({ status: "SHIPPED", trackingNumber: "MANUAL-1" }, { status: "CANCELLED" }).status).toBe("CANCELLED");
});
it.each(["SHIPPED", "DELIVERED"] as const)("exact duplicate %s is a no-op", (status) => {
  expect(shipmentTransition({ status, trackingNumber: "MANUAL-1" }, { status })).toEqual({ status, trackingNumber: "MANUAL-1", changed: false });
});
it.each(["PENDING", "PROCESSING", "SHIPPED", "CANCELLED"] as const)("DELIVERED cannot move to %s", (status) => {
  expect(() => shipmentTransition({ status: "DELIVERED", trackingNumber: "MANUAL-1" }, { status })).toThrow("Delivered shipment cannot go backward");
});
it("cancelled remains terminal and keeps deterministic duplicate rejection", () => {
  expect(() => shipmentTransition({ status: "CANCELLED", trackingNumber: null }, { status: "CANCELLED" })).toThrow("Cancelled shipment cannot be updated");
});
it("rejects backward transitions and missing tracking", () => {
  expect(() => shipmentTransition({ status: "SHIPPED", trackingNumber: "MANUAL-1" }, { status: "PROCESSING" })).toThrow("Shipment status cannot go backward");
  expect(() => shipmentTransition({ status: "PROCESSING", trackingNumber: null }, { status: "SHIPPED" })).toThrow("Tracking number is required");
});
it("pins tracking identity even on duplicate terminal status", () => {
  expect(() => shipmentTransition({ status: "DELIVERED", trackingNumber: "MANUAL-1" }, { status: "DELIVERED", trackingNumber: "IMPERSONATED" })).toThrow("Tracking identity cannot be changed");
});
it.each(["", " ", " PADDED ", "x".repeat(129), "\0", "TRACK\nINJECT"])("rejects invalid tracking %j", (trackingNumber) => {
  expect(updateShipmentStatusSchema.safeParse({ status: "SHIPPED", trackingNumber }).success).toBe(false);
});
