import { ConflictError, NotFoundError } from "@shared/utils";

import prisma from "../config/db.js";
import type {
  ProductInput,
  UpdateProductInput,
} from "../validations/product.schema.js";

export const createProductService = async (body: ProductInput) => {
  const existingProduct = await prisma.product.findFirst({
    where: {
      OR: [{ slug: body.slug }, { sku: body.sku }],
    },
    select: {
      id: true,
      slug: true,
      sku: true,
    },
  });

  if (existingProduct) {
    const field = existingProduct.slug === body.slug ? "slug" : "sku";
    throw new ConflictError(`Product ${field} already exists`, {
      field,
      value: field === "slug" ? body.slug : body.sku,
    });
  }

  return prisma.product.create({
    data: body,
  });
};

export const getAllProductsService = async (
  page = 1,
  limit = 20
) => {
  const skip = (page - 1) * limit;

  const [products, totals] = await Promise.all([
    prisma.product.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc"
      },
      include: {
        category: true
      },
    }),
    prisma.product.count()
  ])

  return {
    products,
    pagination: {
      page,
      limit,
      totals,
      totalPages: Math.ceil(totals / limit),
    },
  };
};

export const getProductByIdService = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: {
      id,
    },
    include: {
      category: true,
      inventory: true,
    },
  });

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  return product;
};

export const updateProductService = async (
  id: string,
  data: UpdateProductInput,
) => {
  const product = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  if (data.slug || data.sku) {
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: {
          not: id,
        },
        OR: [
          ...(data.slug ? [{ slug: data.slug }] : []),
          ...(data.sku ? [{ sku: data.sku }] : []),
        ],
      },
      select: {
        id: true,
        slug: true,
        sku: true,
      },
    });

    if (existingProduct) {
      const field = data.slug && existingProduct.slug === data.slug ? "slug" : "sku";
      throw new ConflictError(`Product ${field} already exists`, {
        field,
        value: field === "slug" ? data.slug : data.sku,
      });
    }
  }

  return prisma.product.update({
    where: {
      id,
    },
    data,
  });
};

export const deleteProductService = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  await prisma.product.delete({
    where: {
      id,
    },
  });
};
