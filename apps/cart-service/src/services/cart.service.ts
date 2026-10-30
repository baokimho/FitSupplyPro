import { createHash } from "node:crypto";
import { classifyFailure, retryOperation, correlationHeaders } from "@shared/utils";
import { fetchDependency, readResilienceConfig, createLogger, parseNodeEnv } from "@shared/utils";
import { BadRequestError, ConflictError, NotFoundError, ServiceUnavailableError } from "@shared/utils";
import { Prisma } from "../generated/prisma/index.js";
import prisma from "../config/db.js";
import { addCartItemSchema, updateCartItemSchema, removeCartItemsSchema } from "../validations/cart.schema.js";
import { z } from "zod";
import type {
  AddCartItemInput,
  RemoveCartItemsInput,
  UpdateCartItemInput,
} from "../validations/cart.schema.js";

type CatalogProduct = {
  id: string;
  name: string;
  price: string | number;
  isPublished: boolean;
  images?: string[] | null;
  imageUrl?: string | null;
};

type CatalogProductResponse = {
  success: boolean;
  data: CatalogProduct;
};

type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: true;
  };
}>;

const catalogServiceUrl = process.env.CATALOG_SERVICE_URL || "http://catalog-service:3002";
const internalSecret = process.env.GATEWAY_SECRET || "";

const toNumber = (value: Prisma.Decimal | string | number) => Number(value);
const catalogProductSchema = z.object({ id: z.string().min(1), name: z.string(),
  price: z.union([z.string().regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/), z.number().nonnegative().max(99_999_999.99)]),
  isPublished: z.boolean(), images: z.array(z.string()).nullish(), imageUrl: z.string().nullish() });

/** One transaction boundary for mutations and coherent checkout snapshots, including absent carts. */
const withCart = <T>(userId: string, work: (tx: Prisma.TransactionClient) => Promise<T>) => prisma.$transaction(async (tx) => {
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`cart.user:${userId}`}, 0))`;
  return work(tx);
});

type CartItemResponse = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const getImageSnapshot = (product: CatalogProduct) => {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0] ?? null;
  }

  return product.imageUrl ?? null;
};

const toCartResponse = (cart: CartWithItems | null, userId: string) => {
  if (!cart) {
    return {
      id: null,
      userId,
      items: [],
      totalItems: 0,
      totalAmount: 0,
    };
  }

  const items: CartItemResponse[] = cart.items.map((item) => {
    const unitPrice = toNumber(item.priceSnapshot);
    const subtotal = Number((unitPrice * item.quantity).toFixed(2));

    return {
      id: item.id,
      productId: item.productId,
      name: item.nameSnapshot,
      quantity: item.quantity,
      unitPrice,
      subtotal,
      image: item.imageSnapshot ?? null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  const totalItems = items.reduce((sum: number, item: CartItemResponse) => sum + item.quantity, 0);
  const totalAmount = Number(
    items
      .reduce((sum: number, item: CartItemResponse) => sum + item.subtotal, 0)
      .toFixed(2),
  );

  return {
    id: cart.id,
    userId: cart.userId,
    version: cart.version,
    items,
    totalItems,
    totalAmount,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

const resilience = readResilienceConfig();
const dependencyLogger = createLogger({ service: "cart-service", environment: parseNodeEnv("NODE_ENV", process.env.NODE_ENV, "development") });

export const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => retryOperation(async () => {
  let response: Response;
  let text: string;

  try {
    ({ response, text } = await fetchDependency(url, init, {
      dependency: "catalog-service",
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
    dependencyLogger.warn({ dependency: "catalog-service", status: response.status }, "catalog request failed");

    if (response.status === 404) {
      throw new NotFoundError(
        message ?? "Resource not found",
        details,
        code,
      );
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
}, { ...resilience, dependency: "catalog-service", operation: init?.method ?? "GET",
  safe: (init?.method ?? "GET") === "GET", logger: dependencyLogger });

export const getProductById = async (productId: string) => {
  try {
    const response = await fetchJson<CatalogProductResponse>(
      `${catalogServiceUrl}/products/${encodeURIComponent(productId)}`,
      {
        headers: {
          ...correlationHeaders(),
          "x-internal-secret": internalSecret,
        },
      },
    );

    const parsed = catalogProductSchema.safeParse(response?.data);
    if (!parsed.success || parsed.data.id !== productId || new Prisma.Decimal(parsed.data.price).decimalPlaces() > 2) {
      throw new ServiceUnavailableError("Catalog service unavailable");
    }
    return parsed.data;
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw new NotFoundError("Product not found", { productId });
    }

    if (error instanceof ServiceUnavailableError) {
      throw new ServiceUnavailableError("Catalog service unavailable", error.details);
    }

    throw error;
  }
};

const readCart = (tx: Prisma.TransactionClient, userId: string) => tx.cart.findUnique({
  where: { userId }, include: { items: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] } },
});
const bumpCart = async (tx: Prisma.TransactionClient, cartId: string, userId: string) => toCartResponse(
  await tx.cart.update({ where: { id: cartId }, data: { version: { increment: 1 } }, include: { items: true } }), userId,
);

export const getUserCartOrEmpty = (userId: string) => withCart(userId, async (tx) => toCartResponse(await readCart(tx, userId), userId));

const ownedItem = async (tx: Prisma.TransactionClient, userId: string, itemId: string) => {
  const cart = await readCart(tx, userId);
  const item = cart?.items.find((item) => item.id === itemId);
  if (!cart || !item) throw new NotFoundError("Cart item not found");
  return { cart, item };
};

export const addCartItemService = async (userId: string, body: AddCartItemInput) => {
  body = addCartItemSchema.parse(body);
  const product = await getProductById(body.productId);
  if (!product.isPublished) throw new BadRequestError("Product is not published", { productId: body.productId });
  return withCart(userId, async (tx) => {
    const cart = await readCart(tx, userId) ?? await tx.cart.create({ data: { userId }, include: { items: true } });
    const existing = cart.items.find((item) => item.productId === body.productId);
    if ((existing?.quantity ?? 0) + body.quantity > 2_147_483_647) throw new BadRequestError("Cart quantity exceeds supported range");
    const snapshot = { nameSnapshot: product.name, priceSnapshot: new Prisma.Decimal(product.price), imageSnapshot: getImageSnapshot(product) };
    await tx.cartItem.upsert({ where: { cartId_productId: { cartId: cart.id, productId: product.id } },
      create: { cartId: cart.id, productId: product.id, quantity: body.quantity, ...snapshot },
      update: { quantity: { increment: body.quantity }, ...snapshot } });
    return bumpCart(tx, cart.id, userId);
  });
};

export const updateCartItemService = async (userId: string, itemId: string, body: UpdateCartItemInput) => {
  body = updateCartItemSchema.parse(body);
  return withCart(userId, async (tx) => {
    const { cart } = await ownedItem(tx, userId, itemId);
    await tx.cartItem.update({ where: { id: itemId }, data: { quantity: body.quantity } });
    return bumpCart(tx, cart.id, userId);
  });
};

export const deleteCartItemService = (userId: string, itemId: string) => withCart(userId, async (tx) => {
  const { cart } = await ownedItem(tx, userId, itemId);
  await tx.cartItem.delete({ where: { id: itemId } });
  return bumpCart(tx, cart.id, userId);
});

export const clearCartService = (userId: string) => withCart(userId, async (tx) => {
  const cart = await readCart(tx, userId);
  if (!cart) return toCartResponse(null, userId);
  await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
  return bumpCart(tx, cart.id, userId);
});

export const removeCartItemsService = async (userId: string, body: RemoveCartItemsInput) => {
  body = removeCartItemsSchema.parse(body);
  return withCart(userId, async (tx) => {
    const cart = await readCart(tx, userId);
    if (!cart) throw new NotFoundError("Cart not found");
    if (body.cartId !== undefined && body.cartId !== cart.id) throw new ConflictError("Cart changed during checkout");
    const ids = [...new Set(body.cartItemIds)].sort();
    const fingerprint = createHash("sha256").update(JSON.stringify(ids)).digest("hex");
    const versioned = body.cartId !== undefined && body.cartVersion !== undefined;
    if (versioned) {
      const receipt = await tx.cartCheckoutRemoval.findUnique({ where: { cartId_cartVersion: { cartId: cart.id, cartVersion: body.cartVersion! } } });
      if (receipt) {
        if (receipt.fingerprint !== fingerprint) throw new ConflictError("Cart changed during checkout");
        return toCartResponse(cart, userId);
      }
    }
    if (body.cartVersion !== undefined && body.cartVersion !== cart.version) throw new ConflictError("Cart changed during checkout");
    const invalidIds = ids.filter((id) => !cart.items.some((item) => item.id === id));
    if (invalidIds.length) throw new NotFoundError("Cart item not found", { cartItemIds: invalidIds });
    await tx.cartItem.deleteMany({ where: { cartId: cart.id, id: { in: ids } } });
    if (versioned) await tx.cartCheckoutRemoval.create({ data: { cartId: cart.id, cartVersion: body.cartVersion!, fingerprint } });
    return bumpCart(tx, cart.id, userId);
  });
};
