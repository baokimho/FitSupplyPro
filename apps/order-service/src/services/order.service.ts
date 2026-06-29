import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from "@shared/utils";
import { Prisma } from "../generated/prisma/index.js";
import type { OrderStatus } from "../generated/prisma/index.js";
import prisma from "../config/db.js";
import type { CreateOrderInput } from "../validations/order.schema.js";

type CatalogProduct = {
  id: string;
  name: string;
  slug: string;
  price: string | number;
  isPublished: boolean;
};

type CatalogProductResponse = {
  success: boolean;
  data: CatalogProduct;
};

type InventoryItem = {
  productId: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
};

type InventoryBatchResponse = {
  items: InventoryItem[];
};

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: true;
  };
}>;

const catalogServiceUrl = process.env.CATALOG_SERVICE_URL || "http://catalog-service:3002";
const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || "http://inventory-service:3004";
const internalSecret = process.env.GATEWAY_SECRET || "";

const jsonHeaders = {
  "content-type": "application/json",
  "x-internal-secret": internalSecret,
};

const toNumber = (value: Prisma.Decimal | string | number) => Number(value);
const toDecimal = (value: number) => new Prisma.Decimal(value.toFixed(2));

const toOrderItemResponse = (item: OrderWithItems["items"][number]) => ({
  id: item.id,
  productId: item.productId,
  productName: item.productName,
  productSlug: item.productSlug,
  quantity: item.quantity,
  unitPrice: toNumber(item.unitPrice),
  subtotal: toNumber(item.subtotal),
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const toOrderResponse = (order: OrderWithItems) => ({
  id: order.id,
  userId: order.userId,
  status: order.status,
  totalAmount: toNumber(order.totalAmount),
  items: order.items.map(toOrderItemResponse),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
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
    console.error("Order service downstream request failed", {
      url,
      method: init?.method ?? "GET",
      status: response.status,
      response: data,
    });

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

const getProductById = async (productId: string) => {
  try {
    const response = await fetchJson<CatalogProductResponse>(
      `${catalogServiceUrl}/products/${productId}`,
      {
        headers: {
          "x-internal-secret": internalSecret,
        },
      },
    );

    return response.data;
  } catch (error) {
    if (error instanceof BadRequestError) {
      throw error;
    }

    if (error instanceof ServiceUnavailableError) {
      throw new ServiceUnavailableError("Catalog service unavailable", error.details);
    }

    throw error;
  }
};

const getInventoryMap = async (productIds: string[]) => {
  try {
    const response = await fetchJson<InventoryBatchResponse>(
      `${inventoryServiceUrl}/products/batch`,
      {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ productIds }),
      },
    );

    return new Map(response.items.map((item) => [item.productId, item]));
  } catch (error) {
    if (error instanceof ServiceUnavailableError) {
      throw new ServiceUnavailableError("Inventory service unavailable", error.details);
    }

    throw error;
  }
};

const reserveStock = async (productId: string, quantity: number) => {
  try {
    await fetchJson(
      `${inventoryServiceUrl}/products/${productId}/reserve`,
      {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          quantity,
          reason: "Order created",
        }),
      },
    );
  } catch (error) {
    if (error instanceof ServiceUnavailableError) {
      throw new ServiceUnavailableError("Inventory service unavailable", error.details);
    }

    throw error;
  }
};

const releaseStock = async (productId: string, quantity: number, reason: string) => {
  try {
    await fetchJson(
      `${inventoryServiceUrl}/products/${productId}/release`,
      {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          quantity,
          reason,
        }),
      },
    );
  } catch (error) {
    if (error instanceof ServiceUnavailableError) {
      throw new ServiceUnavailableError("Inventory service unavailable", error.details);
    }

    throw error;
  }
};

const getOrderByIdOrThrow = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new NotFoundError("Order not found");
  }

  return order;
};

const ensureOwnership = (order: OrderWithItems, userId: string) => {
  if (order.userId !== userId) {
    throw new ForbiddenError("Forbidden");
  }
};

export const createOrderService = async (userId: string, body: CreateOrderInput) => {
  const aggregatedItems = new Map<string, number>();

  for (const item of body.items) {
    aggregatedItems.set(item.productId, (aggregatedItems.get(item.productId) ?? 0) + item.quantity);
  }

  const productIds = [...aggregatedItems.keys()];

  console.info("Creating order", {
    userId,
    productIds,
    catalogServiceUrl,
    inventoryServiceUrl,
  });

  const products = await Promise.all(
    productIds.map(async (productId) => {
      try {
        return await getProductById(productId);
      } catch (error) {
        if (error instanceof BadRequestError && error.message === "Product not found") {
          throw new NotFoundError("Product not found", { productId });
        }

        throw error;
      }
    }),
  );

  const productMap = new Map(products.map((product) => [product.id, product]));

  for (const productId of productIds) {
    const product = productMap.get(productId);

    if (!product) {
      throw new NotFoundError("Product not found", { productId });
    }

    if (!product.isPublished) {
      throw new BadRequestError("Product is not published", { productId });
    }
  }

  const inventoryMap = await getInventoryMap(productIds);

  for (const productId of productIds) {
    const inventory = inventoryMap.get(productId);

    if (!inventory) {
      throw new BadRequestError("Insufficient stock", { productId, availableStock: 0 });
    }

    const requestedQuantity = aggregatedItems.get(productId) ?? 0;

    if (inventory.availableStock < requestedQuantity) {
      throw new BadRequestError("Insufficient stock", {
        productId,
        availableStock: inventory.availableStock,
        requestedQuantity,
      });
    }
  }

  const reservedItems: Array<{ productId: string; quantity: number }> = [];

  try {
    for (const [productId, quantity] of aggregatedItems.entries()) {
      await reserveStock(productId, quantity);
      reservedItems.push({ productId, quantity });
    }

  let totalAmount = 0;

  const itemsToCreate = [...aggregatedItems.entries()].map(([productId, quantity]) => {
    const product = productMap.get(productId);

    if (!product) {
      throw new NotFoundError("Product not found", { productId });
    }

    const unitPrice = Number(product.price);
    const subtotal = unitPrice * quantity;
    totalAmount += subtotal;

    return {
      productId,
      productName: product.name,
      productSlug: product.slug,
      quantity,
      unitPrice: toDecimal(unitPrice),
      subtotal: toDecimal(subtotal),
    };
  });

    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount: toDecimal(totalAmount),
        items: {
          create: itemsToCreate,
        },
      },
      include: {
        items: true,
      },
    });

    return toOrderResponse(order);
  } catch (error) {
    await Promise.allSettled(
      reservedItems.map((item) => releaseStock(item.productId, item.quantity, "Order creation rollback")),
    );
    throw error;
  }
};

export const getMyOrdersService = async (userId: string) => {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders.map(toOrderResponse);
};

export const getOrderByIdService = async (id: string, userId: string) => {
  const order = await getOrderByIdOrThrow(id);
  ensureOwnership(order, userId);
  return toOrderResponse(order);
};

const updateOrderStatus = async (id: string, userId: string, status: OrderStatus) => {
  const order = await getOrderByIdOrThrow(id);
  ensureOwnership(order, userId);

  if (status === "CANCELLED") {
    if (order.status === "CANCELLED") {
      throw new BadRequestError("Order is already cancelled");
    }

    if (order.status === "CONFIRMED") {
      throw new BadRequestError("Confirmed order cannot be cancelled");
    }

    const releasedItems: Array<{ productId: string; quantity: number }> = [];

    try {
      for (const item of order.items) {
        await releaseStock(item.productId, item.quantity, "Order cancelled");
        releasedItems.push({ productId: item.productId, quantity: item.quantity });
      }
    } catch (error) {
      const rollbackResults = await Promise.allSettled(
        releasedItems.map((item) => reserveStock(item.productId, item.quantity)),
      );

      console.error("Rollback after releaseStock failure", {
        orderId: id,
        releasedItems,
        rollbackResults,
        originalError: error,
      });

      throw error;
    }

    let updated;

    try {
      updated = await prisma.order.update({
        where: { id },
        data: { status },
        include: {
          items: true,
        },
      });
    } catch (error) {
      const rollbackResults = await Promise.allSettled(
        releasedItems.map((item) => reserveStock(item.productId, item.quantity)),
      );

      console.error("Rollback after order update failure", {
        orderId: id,
        releasedItems,
        rollbackResults,
        originalError: error,
      });

      throw error;
    }

    return toOrderResponse(updated);
  }

  if (status === "CONFIRMED") {
    if (order.status === "CONFIRMED") {
      throw new BadRequestError("Order is already confirmed");
    }

    if (order.status === "CANCELLED") {
      throw new BadRequestError("Cancelled order cannot be confirmed");
    }
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      items: true,
    },
  });

  return toOrderResponse(updated);
};

export const cancelOrderService = async (id: string, userId: string) =>
  updateOrderStatus(id, userId, "CANCELLED");

export const confirmOrderService = async (id: string, userId: string) =>
  updateOrderStatus(id, userId, "CONFIRMED");
