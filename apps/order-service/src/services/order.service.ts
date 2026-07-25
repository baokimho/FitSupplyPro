import { createHash, randomUUID } from "node:crypto";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from "@shared/utils";
import { Prisma } from "../generated/prisma/index.js";
import type { OrderStatus } from "../generated/prisma/index.js";
import prisma from "../config/db.js";
import type { CheckoutInput, CreateOrderInput } from "../validations/order.schema.js";

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

type CartItem = {
  id: string;
  productId: string;
  quantity: number;
};

type CartResponse = {
  id: string | null;
  userId: string;
  items: CartItem[];
};

type OrderResponse = ReturnType<typeof toOrderResponse>;

type ReservedInventoryItem = { productId: string; quantity: number };

type IdempotencyAttemptRow = {
  id: string;
  requestFingerprint: string;
  status: string;
  responseBody: Prisma.JsonValue | null;
  reservedItems: Prisma.JsonValue | null;
};

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: true;
  };
}>;

const catalogServiceUrl = process.env.CATALOG_SERVICE_URL || "http://catalog-service:3002";
const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || "http://inventory-service:3004";
const cartServiceUrl = process.env.CART_SERVICE_URL || "http://cart-service:3005";
const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3008";
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


const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }

  return value;
};

const createRequestFingerprint = (body: CheckoutInput) =>
  createHash("sha256")
    .update(JSON.stringify(canonicalize(body)))
    .digest("hex");

const claimCheckoutIdempotency = async (
  userId: string,
  idempotencyKey: string,
  requestFingerprint: string,
) => {
  const inserted = await prisma.$queryRaw<IdempotencyAttemptRow[]>`
    INSERT INTO "CheckoutIdempotency" ("id", "userId", "idempotencyKey", "requestFingerprint", "status", "updatedAt")
    VALUES (${randomUUID()}, ${userId}, ${idempotencyKey}, ${requestFingerprint}, 'PROCESSING', NOW())
    ON CONFLICT ("userId", "idempotencyKey") DO NOTHING
    RETURNING "id", "requestFingerprint", "status", "responseBody", "reservedItems"
  `;

  if (inserted[0]) {
    return { row: inserted[0], owner: true };
  }

  const existing = await prisma.$queryRaw<IdempotencyAttemptRow[]>`
    SELECT "id", "requestFingerprint", "status", "responseBody", "reservedItems"
    FROM "CheckoutIdempotency"
    WHERE "userId" = ${userId} AND "idempotencyKey" = ${idempotencyKey}
  `;

  const row = existing[0];
  if (!row) {
    throw new ServiceUnavailableError("Unable to load checkout idempotency state");
  }

  return { row, owner: false };
};

const completeCheckoutIdempotency = async (id: string, order: OrderResponse) => {
  await prisma.$executeRaw`
    UPDATE "CheckoutIdempotency"
    SET "status" = 'COMPLETED', "orderId" = ${order.id}, "responseBody" = ${JSON.stringify(order)}::jsonb, "updatedAt" = NOW()
    WHERE "id" = ${id}
  `;
};

const failCheckoutIdempotency = async (id: string, error: unknown) => {
  await prisma.$executeRaw`
    UPDATE "CheckoutIdempotency"
    SET "status" = 'FAILED', "errorMessage" = ${error instanceof Error ? error.message : "Checkout failed"}, "updatedAt" = NOW()
    WHERE "id" = ${id}
  `;
};
const parseReservedItems = (value: Prisma.JsonValue | null): ReservedInventoryItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return [];
    }

    const productId = (item as Record<string, unknown>).productId;
    const quantity = (item as Record<string, unknown>).quantity;

    if (typeof productId !== "string" || typeof quantity !== "number") {
      return [];
    }

    return [{ productId, quantity }];
  });
};

const recordReservedItem = async (id: string, reservedItems: ReservedInventoryItem[]) => {
  await prisma.$executeRaw`
    UPDATE "CheckoutIdempotency"
    SET "reservedItems" = ${JSON.stringify(reservedItems)}::jsonb, "updatedAt" = NOW()
    WHERE "id" = ${id}
  `;
};

const markCompensationFailed = async (id: string, error: unknown) => {
  await prisma.$executeRaw`
    UPDATE "CheckoutIdempotency"
    SET "status" = 'COMPENSATION_FAILED',
        "compensationError" = ${error instanceof Error ? error.message : "Checkout compensation failed"},
        "updatedAt" = NOW()
    WHERE "id" = ${id}
  `;
};
const compensateReservedItems = async (id: string, reservedItems: ReservedInventoryItem[]) => {
  for (const item of [...reservedItems].reverse()) {
    await releaseStock(
      item.productId,
      item.quantity,
      "Checkout compensation retry",
      `${id}:release:${item.productId}`,
    );
  }
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

const reserveStock = async (productId: string, quantity: number, operationId?: string) => {
  try {
    await fetchJson(
      `${inventoryServiceUrl}/products/${productId}/reserve`,
      {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          quantity,
          reason: "Order created",
          ...(operationId ? { operationId } : {}),
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

const releaseStock = async (productId: string, quantity: number, reason: string, operationId?: string) => {
  try {
    await fetchJson(
      `${inventoryServiceUrl}/products/${productId}/release`,
      {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          quantity,
          reason,
          ...(operationId ? { operationId } : {}),
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

const getUserCart = async (userId: string) => {
  try {
    return await fetchJson<CartResponse>(`${cartServiceUrl}/internal/cart`, {
      headers: {
        ...jsonHeaders,
        "x-user-id": userId,
      },
    });
  } catch (error) {
    if (error instanceof ServiceUnavailableError) {
      throw new ServiceUnavailableError("Cart service unavailable", error.details);
    }

    throw error;
  }
};

const removeCheckedOutCartItems = async (userId: string, cartItemIds: string[]) => {
  try {
    await fetchJson(`${cartServiceUrl}/internal/cart/items`, {
      method: "DELETE",
      headers: {
        ...jsonHeaders,
        "x-user-id": userId,
      },
      body: JSON.stringify({ cartItemIds }),
    });
  } catch (error) {
    if (error instanceof ServiceUnavailableError) {
      throw new ServiceUnavailableError("Cart service unavailable", error.details);
    }

    throw error;
  }
};

const createNotification = async (
  userId: string,
  body: { type: "ORDER_CREATED" | "ORDER_CANCELLED"; title: string; message: string },
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
    console.error("Failed to create order notification", {
      userId,
      type: body.type,
      error,
    });
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

export const createOrderService = async (
  userId: string,
  body: CreateOrderInput,
  checkoutAttemptId?: string,
) => {
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
      await reserveStock(productId, quantity, checkoutAttemptId ? `${checkoutAttemptId}:reserve:${productId}` : undefined);
      reservedItems.push({ productId, quantity });
      if (checkoutAttemptId) {
        await recordReservedItem(checkoutAttemptId, reservedItems);
      }
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

    await createNotification(userId, {
      type: "ORDER_CREATED",
      title: "Order created",
      message: `Order ${order.id} has been created.`,
    });

    return toOrderResponse(order);
  } catch (error) {
    for (const item of [...reservedItems].reverse()) {
      try {
        await releaseStock(
          item.productId,
          item.quantity,
          "Order creation rollback",
          checkoutAttemptId ? `${checkoutAttemptId}:release:${item.productId}` : undefined,
        );
      } catch (compensationError) {
        if (checkoutAttemptId) {
          await markCompensationFailed(checkoutAttemptId, compensationError);
        }

        throw new ServiceUnavailableError("Checkout compensation failed", {
          checkoutAttemptId,
          originalError: error instanceof Error ? error.message : "Checkout failed",
          compensationError: compensationError instanceof Error ? compensationError.message : "Compensation failed",
        });
      }
    }

    throw error;
  }
};

export const checkoutOrderService = async (
  userId: string,
  body: CheckoutInput,
  idempotencyKey: string,
) => {
  const requestFingerprint = createRequestFingerprint(body);
  const attempt = await claimCheckoutIdempotency(userId, idempotencyKey, requestFingerprint);

  if (attempt.row.requestFingerprint !== requestFingerprint) {
    throw new ConflictError("Idempotency key was reused with a different request");
  }

  if (!attempt.owner) {
    if (attempt.row.status === "COMPLETED" && attempt.row.responseBody) {
      return attempt.row.responseBody as unknown as OrderResponse;
    }

    if (attempt.row.status === "COMPENSATION_FAILED") {
      try {
        await compensateReservedItems(attempt.row.id, parseReservedItems(attempt.row.reservedItems));
        await failCheckoutIdempotency(attempt.row.id, new Error("Checkout failed after compensation retry"));
      } catch (error) {
        await markCompensationFailed(attempt.row.id, error);
        throw new ServiceUnavailableError("Checkout compensation failed", {
          checkoutAttemptId: attempt.row.id,
          compensationError: error instanceof Error ? error.message : "Compensation failed",
        });
      }

      throw new ConflictError("Checkout failed and was compensated");
    }

    throw new ConflictError("Checkout already in progress");
  }

  try {
    const requestedIds = [...new Set(body.cartItemIds)];
    const cart = await getUserCart(userId);

    if (!cart.id || cart.items.length === 0) {
      throw new NotFoundError("Cart not found");
    }

    const cartItemMap = new Map(cart.items.map((item) => [item.id, item]));
    const missingIds = requestedIds.filter((itemId) => !cartItemMap.has(itemId));

    if (missingIds.length > 0) {
      throw new NotFoundError("Cart item not found", { cartItemIds: missingIds });
    }

    const items = requestedIds.map((itemId) => {
      const item = cartItemMap.get(itemId);

      if (!item) {
        throw new NotFoundError("Cart item not found", { cartItemId: itemId });
      }

      return {
        productId: item.productId,
        quantity: item.quantity,
      };
    });

    const order = await createOrderService(userId, { items }, attempt.row.id);
    await removeCheckedOutCartItems(userId, requestedIds);
    await completeCheckoutIdempotency(attempt.row.id, order);

    return order;
  } catch (error) {
    if (!(error instanceof Error && error.message === "Checkout compensation failed")) {
      await failCheckoutIdempotency(attempt.row.id, error);
    }
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

      await createNotification(userId, {
        type: "ORDER_CANCELLED",
        title: "Order cancelled",
        message: `Order ${id} has been cancelled.`,
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











