import { config } from "../config/index.js";
import { logger } from "../logger.js";
import { logPath, correlationHeaders } from "@shared/utils";
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
import { createOrderSchema } from "../validations/order.schema.js";
import { aggregateOrderItems } from "../domain/order-items.js";
import { assertOrderTransition } from "../domain/order-lifecycle.js";
import type { CheckoutInput, CreateOrderInput, DeliveryDetailsInput } from "../validations/order.schema.js";

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
  version?: number;
  items: CartItem[];
};

type OrderResponse = ReturnType<typeof toOrderResponse>;

type ReservedInventoryItem = { productId: string; quantity: number };

type CartFinalizationState = { cartItemIds: string[]; cart: { id: string; version: number } };

type IdempotencyAttemptRow = {
  id: string;
  requestFingerprint: string;
  status: string;
  responseBody: Prisma.JsonValue | null;
  reservedItems: Prisma.JsonValue | null;
  finalizationCart: Prisma.JsonValue | null;
};

type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    items: true;
  };
}>;

type DeliverySnapshot = {
  recipientName: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  region: string | null;
  postalCode: string;
  countryCode: string;
};

const catalogServiceUrl = config.catalogServiceUrl;
const inventoryServiceUrl = config.inventoryServiceUrl;
const cartServiceUrl = config.cartServiceUrl;
const notificationServiceUrl = config.notificationServiceUrl;
const internalSecret = config.gatewaySecret;

const jsonHeaders = {
  "content-type": "application/json",
  "x-internal-secret": internalSecret,
};

const maxMoney = new Prisma.Decimal("99999999.99");

const toNumber = (value: Prisma.Decimal | string | number) => Number(value);
const toMoney = (value: Prisma.Decimal | string | number, field: string) => {
  try {
    const decimal = new Prisma.Decimal(String(value));
    if (!decimal.isFinite() || decimal.isNegative() || decimal.decimalPlaces() > 2 || decimal.greaterThan(maxMoney)) {
      throw new Error("Invalid money");
    }

    return new Prisma.Decimal(decimal.toFixed(2));
  } catch {
    throw new BadRequestError(`${field} is invalid`);
  }
};

const assertMoneyFits = (value: Prisma.Decimal, field: string) => {
  if (value.decimalPlaces() > 2 || value.isNegative() || value.greaterThan(maxMoney)) {
    throw new BadRequestError(`${field} is invalid`);
  }
};

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

const toDeliverySnapshot = (delivery: DeliveryDetailsInput): DeliverySnapshot => ({
  recipientName: delivery.recipientName,
  contactPhone: delivery.contactPhone,
  addressLine1: delivery.addressLine1,
  addressLine2: delivery.addressLine2 ?? null,
  city: delivery.city,
  region: delivery.region ?? null,
  postalCode: delivery.postalCode,
  countryCode: delivery.countryCode,
});

const toOrderResponse = (order: OrderWithItems, delivery: DeliverySnapshot | null = null) => ({
  id: order.id,
  userId: order.userId,
  status: order.status,
  totalAmount: toNumber(order.totalAmount),
  delivery,
  items: order.items.map(toOrderItemResponse),
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

const getDeliverySnapshot = async (orderId: string): Promise<DeliverySnapshot | null> => {
  const [row] = await prisma.$queryRaw<Array<{
    recipientName: string | null;
    contactPhone: string | null;
    deliveryAddressLine1: string | null;
    deliveryAddressLine2: string | null;
    deliveryCity: string | null;
    deliveryRegion: string | null;
    deliveryPostalCode: string | null;
    deliveryCountryCode: string | null;
  }>>`
    SELECT "recipientName", "contactPhone", "deliveryAddressLine1", "deliveryAddressLine2",
           "deliveryCity", "deliveryRegion", "deliveryPostalCode", "deliveryCountryCode"
    FROM "Order"
    WHERE "id" = ${orderId}
  `;

  if (!row?.recipientName || !row.contactPhone || !row.deliveryAddressLine1 || !row.deliveryCity ||
      !row.deliveryPostalCode || !row.deliveryCountryCode) {
    return null;
  }

  return {
    recipientName: row.recipientName,
    contactPhone: row.contactPhone,
    addressLine1: row.deliveryAddressLine1,
    addressLine2: row.deliveryAddressLine2,
    city: row.deliveryCity,
    region: row.deliveryRegion,
    postalCode: row.deliveryPostalCode,
    countryCode: row.deliveryCountryCode,
  };
};

const toOrderResponseWithDelivery = async (order: OrderWithItems) =>
  toOrderResponse(order, await getDeliverySnapshot(order.id));

const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
  let response: Response;
  const targetService = [
    [catalogServiceUrl, "catalog-service"], [inventoryServiceUrl, "inventory-service"],
    [cartServiceUrl, "cart-service"], [notificationServiceUrl, "notification-service"],
  ].find(([base]) => url.startsWith(`${base}/`))?.[1];
  const context = { targetService, operation: `${init?.method ?? "GET"} ${logPath(new URL(url).pathname)}` };

  try {
    const headers = new Headers(init?.headers);
    for (const [name, value] of Object.entries(correlationHeaders())) headers.set(name, value);
    response = await fetch(url, { ...init, headers });
  } catch (error) {
    logger.debug(context, "downstream connection failed");
    throw new ServiceUnavailableError("Downstream service unavailable", context, undefined, error);
  }

  let data: unknown;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    if (response.ok) throw error;
    data = {};
  }

  if (!response.ok) {
    const downstreamError = typeof data === "object" && data !== null && "error" in data &&
      typeof data.error === "object" && data.error !== null ? data.error : {};
    const message = "message" in downstreamError && typeof downstreamError.message === "string" ? downstreamError.message : undefined;
    const code = "code" in downstreamError && typeof downstreamError.code === "string" ? downstreamError.code : undefined;
    const details = "details" in downstreamError ? downstreamError.details : undefined;
    logger.debug({ ...context, statusCode: response.status }, "downstream request rejected");

    if (response.status >= 500) {
      throw new ServiceUnavailableError("Downstream service unavailable", {
        ...context,
        statusCode: response.status,
      });
    }

    throw new BadRequestError(
      message ?? "Downstream request failed",
      details,
      code,
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
    RETURNING "id", "requestFingerprint", "status", "responseBody", "reservedItems", "finalizationCart"
  `;

  if (inserted[0]) {
    return { row: inserted[0], owner: true };
  }

  const existing = await prisma.$queryRaw<IdempotencyAttemptRow[]>`
    SELECT "id", "requestFingerprint", "status", "responseBody", "reservedItems", "finalizationCart"
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

const failCheckoutIdempotency = async (id: string, error: unknown, compensationCompleted = false) => {
  await prisma.$executeRaw`
    UPDATE "CheckoutIdempotency"
    SET "status" = 'FAILED', "errorMessage" = ${error instanceof Error ? error.message : "Checkout failed"}, "updatedAt" = NOW()
    WHERE "id" = ${id} AND (${compensationCompleted} OR "status" NOT IN ('COMPENSATION_FAILED', 'ORDER_CREATED'))
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
const parseCartFinalizationState = (value: Prisma.JsonValue | null): CartFinalizationState | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const cartItemIds = record.cartItemIds;
  const cart = record.cart;

  if (!Array.isArray(cartItemIds) || !cart || typeof cart !== "object" || Array.isArray(cart)) {
    return null;
  }

  const cartRecord = cart as Record<string, unknown>;
  if (typeof cartRecord.id !== "string" || typeof cartRecord.version !== "number") {
    return null;
  }

  return {
    cartItemIds: cartItemIds.filter((itemId): itemId is string => typeof itemId === "string"),
    cart: { id: cartRecord.id, version: cartRecord.version },
  };
};

const recordCheckoutFinalization = async (
  id: string,
  order: OrderResponse,
  finalization: CartFinalizationState,
) => {
  await prisma.$executeRaw`
    UPDATE "CheckoutIdempotency"
    SET "status" = 'ORDER_CREATED',
        "orderId" = ${order.id},
        "responseBody" = ${JSON.stringify(order)}::jsonb,
        "finalizationCart" = ${JSON.stringify(finalization)}::jsonb,
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
      throw new ServiceUnavailableError("Catalog service unavailable", error.details, undefined, error);
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
      throw new ServiceUnavailableError("Inventory service unavailable", error.details, undefined, error);
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
      throw new ServiceUnavailableError("Inventory service unavailable", error.details, undefined, error);
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
      throw new ServiceUnavailableError("Inventory service unavailable", error.details, undefined, error);
    }

    throw error;
  }
};

const consumeStock = async (productId: string, quantity: number, reason: string, operationId: string) => {
  try {
    await fetchJson(
      `${inventoryServiceUrl}/products/${productId}/consume`,
      {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          quantity,
          reason,
          operationId,
        }),
      },
    );
  } catch (error) {
    if (error instanceof ServiceUnavailableError) {
      throw new ServiceUnavailableError("Inventory service unavailable", error.details, undefined, error);
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
      throw new ServiceUnavailableError("Cart service unavailable", error.details, undefined, error);
    }

    throw error;
  }
};

const removeCheckedOutCartItems = async (
  userId: string,
  cartItemIds: string[],
  cart: { id: string; version: number },
) => {
  try {
    await fetchJson(`${cartServiceUrl}/internal/cart/items`, {
      method: "DELETE",
      headers: {
        ...jsonHeaders,
        "x-user-id": userId,
      },
      body: JSON.stringify({ cartItemIds, cartId: cart.id, cartVersion: cart.version }),
    });
  } catch (error) {
    if (error instanceof ServiceUnavailableError) {
      throw new ServiceUnavailableError("Cart service unavailable", error.details, undefined, error);
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
    logger.warn({
      userId,
      type: body.type,
      err: error,
      targetService: "notification-service",
      operation: "create-notification",
    }, "order notification failed");
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
  body = createOrderSchema.parse(body);
  const aggregatedItems = aggregateOrderItems(body.items);

  const productIds = [...aggregatedItems.keys()];

  logger.debug({
    userId,
    itemCount: productIds.length,
    operation: "create-order",
  }, "creating order");

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

  let totalAmount = new Prisma.Decimal(0);

  const itemsToCreate = [...aggregatedItems.entries()].map(([productId, quantity]) => {
    const product = productMap.get(productId);

    if (!product) {
      throw new NotFoundError("Product not found", { productId });
    }

    if (!product.name || !product.slug) {
      throw new BadRequestError("Product snapshot is invalid", { productId });
    }

    const unitPrice = toMoney(product.price, "Product price");
    const subtotal = unitPrice.times(quantity);
    assertMoneyFits(subtotal, "Item subtotal");
    totalAmount = totalAmount.plus(subtotal);

    return {
      productId,
      productName: product.name,
      productSlug: product.slug,
      quantity,
      unitPrice,
      subtotal,
    };
  });

  assertMoneyFits(totalAmount, "Order total");
  const reservationId = checkoutAttemptId ?? randomUUID();
  const reservedItems: ReservedInventoryItem[] = [];

  try {
    for (const [productId, quantity] of aggregatedItems.entries()) {
      await reserveStock(productId, quantity, `${reservationId}:reserve:${productId}`);
      reservedItems.push({ productId, quantity });
      if (checkoutAttemptId) {
        await recordReservedItem(checkoutAttemptId, reservedItems);
      }
    }

    const delivery = toDeliverySnapshot(body.delivery);
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          totalAmount,
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          items: true,
        },
      });

      await tx.$executeRaw`UPDATE "Order"
        SET "recipientName" = ${delivery.recipientName},
            "contactPhone" = ${delivery.contactPhone},
            "deliveryAddressLine1" = ${delivery.addressLine1},
            "deliveryAddressLine2" = ${delivery.addressLine2},
            "deliveryCity" = ${delivery.city},
            "deliveryRegion" = ${delivery.region},
            "deliveryPostalCode" = ${delivery.postalCode},
            "deliveryCountryCode" = ${delivery.countryCode}
        WHERE "id" = ${created.id}`;

      return created;
    });

    await createNotification(userId, {
      type: "ORDER_CREATED",
      title: "Order created",
      message: `Order ${order.id} has been created.`,
    });

    return toOrderResponse(order, delivery);
  } catch (error) {
    let compensationFailed = false;
    for (const item of [...reservedItems].reverse()) {
      try {
        await releaseStock(
          item.productId,
          item.quantity,
          "Order creation rollback",
          `${reservationId}:release:${item.productId}`,
        );
      } catch (compensationError) {
        compensationFailed = true;
        logger.error({ err: compensationError, originalError: error, userId, reservationId,
          productId: item.productId, quantity: item.quantity, operation: "create-order-compensation" },
        "inventory compensation failed");
      }
    }
    if (compensationFailed && checkoutAttemptId) {
      try {
        await markCompensationFailed(checkoutAttemptId, error);
      } catch (stateError) {
        logger.error({ err: stateError, checkoutAttemptId, operation: "record-compensation-failure" }, "compensation state persistence failed");
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

    if (attempt.row.status === "ORDER_CREATED" && attempt.row.responseBody) {
      const finalization = parseCartFinalizationState(attempt.row.finalizationCart);
      if (!finalization) {
        throw new ServiceUnavailableError("Checkout finalization state is incomplete", { checkoutAttemptId: attempt.row.id });
      }

      await removeCheckedOutCartItems(userId, finalization.cartItemIds, finalization.cart);
      await completeCheckoutIdempotency(attempt.row.id, attempt.row.responseBody as unknown as OrderResponse);
      return attempt.row.responseBody as unknown as OrderResponse;
    }
    if (attempt.row.status === "COMPENSATION_FAILED") {
      try {
        await compensateReservedItems(attempt.row.id, parseReservedItems(attempt.row.reservedItems));
        await failCheckoutIdempotency(attempt.row.id, new Error("Checkout failed after compensation retry"), true);
      } catch (error) {
        await markCompensationFailed(attempt.row.id, error);
        throw new ServiceUnavailableError("Checkout compensation failed", {
          checkoutAttemptId: attempt.row.id,
        }, undefined, error);
      }

      throw new ConflictError("Checkout failed and was compensated");
    }

    throw new ConflictError("Checkout already in progress");
  }

  try {
    const requestedIds = [...new Set(body.cartItemIds)];
    const cart = await getUserCart(userId);

    if (!cart.id || !cart.version || cart.items.length === 0) {
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

    const order = await createOrderService(userId, { items, delivery: body.delivery }, attempt.row.id);
    const finalization = { cartItemIds: requestedIds, cart: { id: cart.id, version: cart.version } };
    await recordCheckoutFinalization(attempt.row.id, order, finalization);
    try {
      await removeCheckedOutCartItems(userId, requestedIds, finalization.cart);
    } catch (error) {
      throw new ServiceUnavailableError("Checkout finalization failed", {
        checkoutAttemptId: attempt.row.id,
      }, undefined, error);
    }
    await completeCheckoutIdempotency(attempt.row.id, order);

    return order;
  } catch (error) {
    if (!(error instanceof Error && (error.message === "Checkout compensation failed" || error.message === "Checkout finalization failed"))) {
      try {
        await failCheckoutIdempotency(attempt.row.id, error);
      } catch (stateError) {
        logger.error({ err: stateError, checkoutAttemptId: attempt.row.id, operation: "record-checkout-failure" }, "checkout state persistence failed");
      }
    }
    throw error;
  }
};

export const getOrderShippingSnapshotService = async (id: string) => {
  const order = await getOrderByIdOrThrow(id);
  const delivery = await getDeliverySnapshot(order.id);

  if (!delivery) {
    throw new BadRequestError("Order delivery snapshot is incomplete", { orderId: id });
  }

  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    delivery,
  };
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

  return Promise.all(orders.map(toOrderResponseWithDelivery));
};

export const getOrderByIdService = async (id: string, userId: string) => {
  const order = await getOrderByIdOrThrow(id);
  ensureOwnership(order, userId);
  return toOrderResponseWithDelivery(order);
};

const updateOrderStatus = async (id: string, status: OrderStatus, ownerId?: string) => {
  const order = await getOrderByIdOrThrow(id);
  if (ownerId) ensureOwnership(order, ownerId);
  assertOrderTransition(order.status, status);
  const context = { orderId: id, userId: order.userId, fromStatus: order.status, toStatus: status, operation: "transition-order" };

  if (order.pendingStatus && order.pendingStatus !== status) {
    throw new ConflictError("Another order command requires completion", { orderId: id }, "ORDER_COMMAND_IN_PROGRESS");
  }
  if (status === "CANCELLED" && order.reservationConsumed) {
    throw new ConflictError("Order inventory was already consumed", { orderId: id }, "ORDER_INVENTORY_CONSUMED");
  }

  const inventoryCommand = status === "CANCELLED" || status === "PROCESSING";
  if (inventoryCommand) {
    if (!order.pendingStatus) {
      const claim = await prisma.order.updateMany({
        where: { id, status: order.status, pendingStatus: null },
        data: { pendingStatus: status },
      });
      if (claim.count !== 1) {
        throw new ConflictError("Order changed during command", { orderId: id }, "ORDER_COMMAND_IN_PROGRESS");
      }
    }
    // Durable intent prevents opposite commands after partial/ambiguous Inventory success.
    try {
      for (const item of order.items) {
        if (status === "CANCELLED") {
          await releaseStock(item.productId, item.quantity, "Order cancelled", `${id}:release:${item.productId}`);
        } else if (!order.reservationConsumed) {
          await consumeStock(item.productId, item.quantity, "Order processing", `${id}:consume:${item.productId}`);
        }
      }
    } catch (error) {
      logger.error({ ...context, err: error }, "order inventory command incomplete; retry same command");
      throw error;
    }
  }

  const result = await prisma.order.updateMany({
    where: { id, status: order.status, pendingStatus: inventoryCommand ? status : null },
    data: { status, pendingStatus: null, ...(status === "PROCESSING" ? { reservationConsumed: true } : {}) },
  });
  if (result.count !== 1) {
    throw new ConflictError("Order changed during command", { orderId: id }, "INVALID_ORDER_TRANSITION");
  }
  logger.info(context, "order transitioned");
  if (status === "CANCELLED") {
    await createNotification(order.userId, {
      type: "ORDER_CANCELLED", title: "Order cancelled", message: `Order ${id} has been cancelled.`,
    });
  }
  return toOrderResponseWithDelivery(await getOrderByIdOrThrow(id));
};

export const cancelOrderService = async (id: string, userId: string) =>
  updateOrderStatus(id, "CANCELLED", userId);

export const advanceOrderService = async (
  id: string, userId: string, role: string | undefined,
  status: "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED",
) => {
  if (role !== "ADMIN") throw new ForbiddenError("Forbidden");
  logger.debug({ orderId: id, actorId: userId, toStatus: status, operation: "admin-order-command" }, "order command authorized");
  return updateOrderStatus(id, status);
};

export const confirmOrderService = async (id: string, userId: string, role?: string) =>
  advanceOrderService(id, userId, role, "CONFIRMED");

// Internal route is protected by existing shared gateway secret; never gateway-accessible.
export const confirmInternalOrderService = async (id: string) => {
  const order = await getOrderByIdOrThrow(id);
  // Preserve existing internal confirmation retry contract without a self-transition.
  if (order.status === "CONFIRMED" && !order.pendingStatus) return toOrderResponseWithDelivery(order);
  return updateOrderStatus(id, "CONFIRMED");
};


























