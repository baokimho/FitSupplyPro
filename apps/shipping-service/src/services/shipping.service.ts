import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from "@shared/utils";
import { Prisma } from "../generated/prisma/index.js";
import type { ShipmentStatus } from "../generated/prisma/index.js";
import prisma from "../config/db.js";
import type {
  CreateShipmentInput,
  UpdateShipmentStatusInput,
} from "../validations/shipping.schema.js";

type OrderResponse = {
  id: string;
  userId: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  delivery: {
    recipientName: string;
    contactPhone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    region: string | null;
    postalCode: string;
    countryCode: string;
  };
};

type ShipmentWithScalars = Prisma.ShipmentGetPayload<Record<string, never>>;

const orderServiceUrl = process.env.ORDER_SERVICE_URL || "http://order-service:3003";
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3008";
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

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (error) {
    throw new ServiceUnavailableError("Downstream service unavailable", {
      url,
      cause: error instanceof Error ? error.message : "Unknown error",
    });
  }

  const text = await response.text();
  const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};

  if (!response.ok) {
    if (response.status === 404) {
      throw new NotFoundError(typeof data.message === "string" ? data.message : "Resource not found", data);
    }

    if (response.status === 403) {
      throw new ForbiddenError("Forbidden", data);
    }

    if (response.status >= 500) {
      throw new ServiceUnavailableError("Downstream service unavailable", {
        url,
        status: response.status,
        response: data,
      });
    }

    throw new BadRequestError(
      typeof data.message === "string" ? data.message : "Downstream request failed",
      data,
    );
  }

  return data as T;
};

const getOrder = async (orderId: string) => {
  try {
    return await fetchJson<OrderResponse>(`${orderServiceUrl}/internal/orders/${orderId}/shipping-snapshot`, {
      headers: jsonHeaders,
    });
  } catch (error) {
    if (error instanceof ServiceUnavailableError) {
      throw new ServiceUnavailableError("Order service unavailable", error.details);
    }

    throw error;
  }
};

const createNotification = async (
  userId: string,
  body: { type: "ORDER_SHIPPED" | "ORDER_DELIVERED"; title: string; message: string },
) => {
  try {
    await fetchJson(`${notificationServiceUrl}/internal/notifications`, {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        userId,
        ...body,
      }),
    });
  } catch (error) {
    console.error("Failed to create shipping notification", {
      userId,
      type: body.type,
      error,
    });
  }
};

const getShipmentByIdOrThrow = async (id: string) => {
  const shipment = await prisma.shipment.findUnique({ where: { id } });

  if (!shipment) {
    throw new NotFoundError("Shipment not found");
  }

  return shipment;
};

const transitionRank: Record<ShipmentStatus, number> = {
  PENDING: 0,
  PROCESSING: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  CANCELLED: 99,
};

export const createShipmentService = async (_userId: string, body: CreateShipmentInput) => {
  const existing = await prisma.shipment.findFirst({ where: { orderId: body.orderId } });

  if (existing) {
    return toShipmentResponse(existing);
  }

  const order = await getOrder(body.orderId);

  if (order.status !== "CONFIRMED") {
    throw new BadRequestError("Order must be confirmed before shipment", {
      orderId: order.id,
      status: order.status,
    });
  }

  try {
    const shipment = await prisma.shipment.create({
      data: {
        userId: order.userId,
        orderId: order.id,
        status: "PROCESSING",
        recipientName: order.delivery.recipientName,
        phone: order.delivery.contactPhone,
        addressLine1: order.delivery.addressLine1,
        addressLine2: order.delivery.addressLine2,
        city: order.delivery.city,
        postalCode: order.delivery.postalCode,
        country: order.delivery.countryCode,
      },
    });

    return toShipmentResponse(shipment);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const shipment = await prisma.shipment.findFirst({ where: { orderId: body.orderId } });

      if (shipment) {
        return toShipmentResponse(shipment);
      }
    }

    throw error;
  }
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

export const updateShipmentStatusService = async (
  id: string,
  userId: string,
  body: UpdateShipmentStatusInput,
) => {
  const shipment = await getShipmentByIdOrThrow(id);

  if (shipment.userId !== userId) {
    throw new ForbiddenError("Forbidden");
  }

  if (shipment.status === "CANCELLED") {
    throw new BadRequestError("Cancelled shipment cannot be updated");
  }

  if (shipment.status === "DELIVERED" && body.status !== "DELIVERED") {
    throw new BadRequestError("Delivered shipment cannot go backward");
  }

  if (body.status !== "CANCELLED" && transitionRank[body.status] < transitionRank[shipment.status]) {
    throw new BadRequestError("Shipment status cannot go backward");
  }

  if ((body.status === "SHIPPED" || body.status === "DELIVERED") && !(body.trackingNumber ?? shipment.trackingNumber)) {
    throw new BadRequestError("Tracking number is required for shipped or delivered shipments");
  }

  const updated = await prisma.shipment.update({
    where: { id },
    data: {
      status: body.status,
      trackingNumber: body.trackingNumber ?? shipment.trackingNumber,
    },
  });

  if (body.status === "SHIPPED") {
    await createNotification(userId, {
      type: "ORDER_SHIPPED",
      title: "Order shipped",
      message: `Shipment ${id} has shipped.`,
    });
  }

  if (body.status === "DELIVERED") {
    await createNotification(userId, {
      type: "ORDER_DELIVERED",
      title: "Order delivered",
      message: `Shipment ${id} has been delivered.`,
    });
  }

  return toShipmentResponse(updated);
};
