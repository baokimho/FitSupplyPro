import { BadRequestError, ConflictError } from "@shared/utils";
import type { ShipmentStatus } from "../generated/prisma/index.js";

const rank: Record<ShipmentStatus, number> = { PENDING: 0, PROCESSING: 1, SHIPPED: 2, DELIVERED: 3, CANCELLED: 99 };

export function shipmentTransition(current: { status: ShipmentStatus; trackingNumber: string | null }, input: { status: ShipmentStatus; trackingNumber?: string }) {
  if (current.status === "CANCELLED") throw new BadRequestError("Cancelled shipment cannot be updated");
  if (current.status === "DELIVERED" && input.status !== "DELIVERED") throw new BadRequestError("Delivered shipment cannot go backward");
  if (input.status !== "CANCELLED" && rank[input.status] < rank[current.status]) throw new BadRequestError("Shipment status cannot go backward");
  if (current.trackingNumber && input.trackingNumber !== undefined && input.trackingNumber !== current.trackingNumber) throw new ConflictError("Tracking identity cannot be changed");
  const trackingNumber = input.trackingNumber ?? current.trackingNumber;
  if ((input.status === "SHIPPED" || input.status === "DELIVERED") && !trackingNumber) throw new BadRequestError("Tracking number is required for shipped or delivered shipments");
  return { status: input.status, trackingNumber, changed: current.status !== input.status || current.trackingNumber !== trackingNumber };
}
