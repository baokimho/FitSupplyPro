import { BadRequestError, NotFoundError, ServiceUnavailableError } from "@shared/utils";
import { Prisma } from "../generated/prisma/index.js";
import prisma from "../config/db.js";
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
const toDecimal = (value: number) => new Prisma.Decimal(value.toFixed(2));

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
    items,
    totalItems,
    totalAmount,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

export const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> => {
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
    console.error("Cart service downstream request failed", {
      url,
      method: init?.method ?? "GET",
      status: response.status,
      response: data,
    });

    if (response.status === 404) {
      throw new NotFoundError(
        typeof data.message === "string" ? data.message : "Resource not found",
        data,
      );
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

export const getProductById = async (productId: string) => {
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
    if (error instanceof NotFoundError) {
      throw new NotFoundError("Product not found", { productId });
    }

    if (error instanceof ServiceUnavailableError) {
      throw new ServiceUnavailableError("Catalog service unavailable", error.details);
    }

    throw error;
  }
};

export const getOrCreateCart = async (userId: string) => {
  const existingCart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  if (existingCart) {
    return existingCart;
  }

  return prisma.cart.create({
    data: { userId },
    include: { items: true },
  });
};

const getCartByUserId = async (userId: string) =>
  prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

export const getUserCartOrEmpty = async (userId: string) => {
  const cart = await getCartByUserId(userId);
  return toCartResponse(cart, userId);
};

export const ensureCartItemBelongsToUserCart = async (userId: string, itemId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    throw new NotFoundError("Cart item not found");
  }

  const item = await prisma.cartItem.findFirst({
    where: {
      id: itemId,
      cartId: cart.id,
    },
  });

  if (!item) {
    throw new NotFoundError("Cart item not found");
  }

  return { cart, item };
};

export const addCartItemService = async (userId: string, body: AddCartItemInput) => {
  const product = await getProductById(body.productId);

  if (!product.isPublished) {
    throw new BadRequestError("Product is not published", { productId: body.productId });
  }

  const cart = await getOrCreateCart(userId);
  const existingItem = cart.items.find((item) => item.productId === body.productId);

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + body.quantity,
        nameSnapshot: product.name,
        priceSnapshot: toDecimal(Number(product.price)),
        imageSnapshot: getImageSnapshot(product),
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: body.quantity,
        nameSnapshot: product.name,
        priceSnapshot: toDecimal(Number(product.price)),
        imageSnapshot: getImageSnapshot(product),
      },
    });
  }

  return getUserCartOrEmpty(userId);
};

export const updateCartItemService = async (
  userId: string,
  itemId: string,
  body: UpdateCartItemInput,
) => {
  await ensureCartItemBelongsToUserCart(userId, itemId);

  await prisma.cartItem.update({
    where: { id: itemId },
    data: {
      quantity: body.quantity,
    },
  });

  return getUserCartOrEmpty(userId);
};

export const deleteCartItemService = async (userId: string, itemId: string) => {
  await ensureCartItemBelongsToUserCart(userId, itemId);

  await prisma.cartItem.delete({
    where: { id: itemId },
  });

  return getUserCartOrEmpty(userId);
};

export const clearCartService = async (userId: string) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    return toCartResponse(null, userId);
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return toCartResponse(
    {
      ...cart,
      items: [],
    } as CartWithItems,
    userId,
  );
};

export const removeCartItemsService = async (userId: string, body: RemoveCartItemsInput) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: true },
  });

  if (!cart) {
    throw new NotFoundError("Cart not found");
  }

  const requestedIds = new Set(body.cartItemIds);
  const cartItemIds = new Set(cart.items.map((item) => item.id));
  const invalidIds = [...requestedIds].filter((itemId) => !cartItemIds.has(itemId));

  if (invalidIds.length > 0) {
    throw new NotFoundError("Cart item not found", { cartItemIds: invalidIds });
  }

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      id: {
        in: [...requestedIds],
      },
    },
  });

  return getUserCartOrEmpty(userId);
};
