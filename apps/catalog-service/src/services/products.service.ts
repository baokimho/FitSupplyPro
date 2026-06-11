import { NotFoundError } from "@shared/utils";

import prisma from "../config/db.js";
import type {
  ProductInput,
  UpdateProductInput,
} from "../validations/product.schema.js";

export const createProductService = async (body: ProductInput) => {
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
