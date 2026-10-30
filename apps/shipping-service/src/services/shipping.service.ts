import { classifyFailure, retryOperation, correlationHeaders, createIntegrationEvent, enqueueOutboxEvent, getCorrelation, eventUuidSchema, traced, SpanKind } from "@shared/utils";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { fetchDependency, readResilienceConfig, createLogger, parseNodeEnv } from "@shared/utils";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from "@shared/utils";
import { Prisma } from "../generated/prisma/index.js";
import prisma from "../config/db.js";
import { createShipmentSchema, updateShipmentStatusSchema } from "../validations/shipping.schema.js";
import { shipmentTransition } from "../domain/shipment.js";
import type {
  CreateShipmentInput,
  UpdateShipmentStatusInput,
} from "../validations/shipping.schema.js";

const orderSnapshotSchema = z.object({ id: eventUuidSchema, userId: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  delivery: z.object({ recipientName: z.string().min(1), contactPhone: z.string().min(1),
    addressLine1: z.string().min(1), addressLine2: z.string().nullish(), city: z.string().min(1),
    postalCode: z.string().min(1), countryCode: z.string().length(2) }) });

type ShipmentWithScalars = Prisma.ShipmentGetPayload<Record<string, never>>;

const orderServiceUrl = process.env.ORDER_SERVICE_URL || "http://order-service:3003";
const internalSecret = process.env.GATEWAY_SECRET || "";

const jsonHeaders = {
  "content-type": "application/json",
  "x-internal-secret": internalSecret,
};

const toShipmentResponse = (shipment: ShipmentWithScalars) => ({
  id: shipment.id,
  userId: shipment.userId,
  orderId: shipment.orderId,
  status: shipment.status,
  recipientName: shipment.recipientName,
  phone: shipment.phone,
  addressLine1: shipment.addressLine1,
  addressLine2: shipment.addressLine2,
  city: shipment.city,
  postalCode: shipment.postalCode,
  country: shipment.country,
  trackingNumber: shipment.trackingNumber,
  createdAt: shipment.createdAt,
  updatedAt: shipment.updatedAt,
});

const resilience = readResilienceConfig();
const dependencyLogger = createLogger({ service: "shipping-service", environment: parseNodeEnv("NODE_ENV", process.env.NODE_ENV, "development") });

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => retryOperation(async () => {
  let response: Response;
  let text: string;

  try {
    ({ response, text } = await fetchDependency(url, init, {
      dependency: "order-service",
      operation: init?.method ?? "GET", timeoutMs: resilience.timeoutMs, safe: (init?.method ?? "GET") === "GET", logger: dependencyLogger,
    }));
  } catch (error) {
    if (classifyFailure(error) === "cancelled") throw error;
    throw new ServiceUnavailableError("Downstream service unavailable", undefined, undefined, error);
  }

  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    if (response.ok) throw new ServiceUnavailableError("Downstream service unavailable", undefined, undefined, error);
    data = {};
  }

  if (!response.ok) {
    const downstreamError = typeof data === "object" && data !== null && "error" in data &&
      typeof data.error === "object" && data.error !== null ? data.error : {};
    const message = "message" in downstreamError && typeof downstreamError.message === "string" ? downstreamError.message : undefined;
    const code = "code" in downstreamError && typeof downstreamError.code === "string" ? downstreamError.code : undefined;
    const details = "details" in downstreamError ? downstreamError.details : undefined;
    if (response.status === 404) {
      throw new NotFoundError(message ?? "Resource not found", details, code);
    }

    if (response.status === 403) {
      throw new ForbiddenError("Forbidden", details, code);
    }

    if (response.status >= 500) {
      throw new ServiceUnavailableError("Downstream service unavailable", {
        status: response.status,
      });
    }

    throw new BadRequestError(
      message ?? "Downstream request failed",
      details,
      code,
    );
  }

  return data as T;
}, { ...resilience, dependency: "order-service", operation: init?.method ?? "GET", safe: (init?.method ?? "GET") === "GET", logger: dependencyLogger });

const getOrder = async (orderId: string) => {
  try {
    const response = await fetchJson<unknown>(`${orderServiceUrl}/internal/orders/${encodeURIComponent(orderId)}/shipping-snapshot`, {
      headers: { ...jsonHeaders, ...correlationHeaders() },
    });
    const parsed = orderSnapshotSchema.safeParse(response);
    if (!parsed.success || parsed.data.id !== orderId) throw new ServiceUnavailableError("Order service unavailable");
    return parsed.data;
  } catch (error) {
    if (error instanceof ServiceUnavailableError) {
      throw new ServiceUnavailableError("Order service unavailable", error.details);
    }

    throw error;
  }
};

const getShipmentByIdOrThrow = async (id: string) => {
  const shipment = await prisma.shipment.findUnique({ where: { id } });

  if (!shipment) {
    throw new NotFoundError("Shipment not found");
  }

  return shipment;
};

export const createShipmentService = async (_userId: string, body: CreateShipmentInput, role?: string) => {
  if (role !== "ADMIN") throw new ForbiddenError("Forbidden");
  body = createShipmentSchema.parse(body);
  const existing = await prisma.shipment.findFirst({ where: { orderId: body.orderId } });
  if (existing) return toShipmentResponse(existing);
  const order = await getOrder(body.orderId);
  if (order.status !== "CONFIRMED") throw new BadRequestError("Order must be confirmed before shipment", { orderId: order.id, status: order.status });
  return traced("shipping.create", SpanKind.INTERNAL, {}, () => prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`shipping.order:${body.orderId}`}, 0))`;
    const existing = await tx.shipment.findUnique({ where: { orderId: body.orderId } });
    if (existing) return toShipmentResponse(existing);
    const shipment = await tx.shipment.create({ data: {
      userId: order.userId, orderId: order.id, status: "PROCESSING", recipientName: order.delivery.recipientName,
      phone: order.delivery.contactPhone, addressLine1: order.delivery.addressLine1, addressLine2: order.delivery.addressLine2,
      city: order.delivery.city, postalCode: order.delivery.postalCode, country: order.delivery.countryCode,
    } });
    dependencyLogger.info({ shipmentId: shipment.id, orderId: order.id, status: shipment.status }, "shipment creation staged");
    return toShipmentResponse(shipment);
  }));
};
export const getMyShipmentsService = async (userId: string) => {
  const shipments = await prisma.shipment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return shipments.map(toShipmentResponse);
};

export const getShipmentByIdService = async (id: string, userId: string) => {
  const shipment = await getShipmentByIdOrThrow(id);

  if (shipment.userId !== userId) {
    throw new ForbiddenError("Forbidden");
  }

  return toShipmentResponse(shipment);
};

export const updateShipmentStatusService = async (id: string, _userId: string, body: UpdateShipmentStatusInput, role?: string) => {
  if (role !== "ADMIN") throw new ForbiddenError("Forbidden");
  body = updateShipmentStatusSchema.parse(body);
  const snapshot = await getShipmentByIdOrThrow(id);
  const decision = shipmentTransition(snapshot, body);
  if (decision.changed && (body.status === "SHIPPED" || body.status === "DELIVERED")) {
    // Order PROCESSING cannot be customer-cancelled; never dispatch a still-cancellable Order.
    const order = await getOrder(snapshot.orderId);
    if (order.userId !== snapshot.userId || !["PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status)) {
      throw new BadRequestError("Order must be processing before dispatch");
    }
  }
  return traced("shipping.transition", SpanKind.INTERNAL, {}, () => prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Shipment" WHERE "id" = ${id} FOR UPDATE`;
    const current = await tx.shipment.findUniqueOrThrow({ where: { id } });
    const next = shipmentTransition(current, body);
    if (!next.changed) return toShipmentResponse(current);
    const updated = await tx.shipment.update({ where: { id }, data: { status: next.status, trackingNumber: next.trackingNumber } });
    if (next.status === "SHIPPED" || next.status === "DELIVERED") {
      const event = createIntegrationEvent({ eventType: next.status === "SHIPPED" ? "shipment.shipped" : "shipment.delivered",
        correlationId: getCorrelation()?.traceId ?? randomUUID(), causationId: null,
        data: { orderId: updated.orderId, shipmentId: updated.id, userId: updated.userId } });
      await enqueueOutboxEvent(tx, event, `shipment:${updated.id}:${next.status}`);
      dependencyLogger.info({ eventId: event.eventId, eventType: event.eventType, correlationId: event.correlationId,
        shipmentId: updated.id, orderId: updated.orderId, status: updated.status }, "shipment transition and notification intent staged");
    }
    return toShipmentResponse(updated);
  }));
};
