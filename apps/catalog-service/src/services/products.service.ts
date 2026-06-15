import { ConflictError, NotFoundError } from "@shared/utils";
import type { Prisma } from "../generated/prisma/index.js";
import prisma from "../config/db.js";
import type {
  ProductInput,
  UpdateProductInput,
  ProductQueryInput
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

  const [category, brand] = await Promise.all([
    prisma.category.findUnique({ where: { id: body.categoryId }, select: { id: true } }),
    prisma.brand.findUnique({ where: { id: body.brandId }, select: { id: true } }),
  ]);

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  if (!brand) {
    throw new NotFoundError("Brand not found");
  }

  return prisma.product.create({
    data: body,
    include: {
      category: true,
      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
        },
      },
    },
  });
};

export const getAllProductsService = async (
  {  
  page = 1,
  limit = 20, 
  categoryId, 
  brandId,
  search, 
  isPublished, 
  sort
  }: ProductQueryInput
) => {
  const skip = (page - 1) * limit;

  const where: Prisma.ProductWhereInput = {
    ...(categoryId ? { categoryId } : {}),
    ...(brandId ? { brandId } : {}),

    ...(typeof isPublished === "boolean" ? { isPublished } : {}),

    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  let orderBy: Prisma.ProductOrderByWithRelationInput;

  switch(sort){
    case "price_asc":
      orderBy = {
        price: "asc"
      };
      break
    case "price_desc":
      orderBy = {
        price: "desc"
      };
      break
    case "oldest":
      orderBy = {
        createdAt: "asc"
      };
      break
    default: 
      orderBy = {
        createdAt: "desc"
      };
  }

  const [products, totals] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          }
        }
      },
    }),
    prisma.product.count(
      {where}
    )
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
      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
        },
      },
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

  if (data.categoryId || data.brandId) {
    const [category, brand] = await Promise.all([
      data.categoryId
        ? prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } })
        : Promise.resolve(null),
      data.brandId
        ? prisma.brand.findUnique({ where: { id: data.brandId }, select: { id: true } })
        : Promise.resolve(null),
    ]);

    if (data.categoryId && !category) {
      throw new NotFoundError("Category not found");
    }

    if (data.brandId && !brand) {
      throw new NotFoundError("Brand not found");
    }
  }

  return prisma.product.update({
    where: {
      id,
    },
    data,
    include: {
      category: true,
      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
        },
      },
    },
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

export const publishProductService = async (id: string) => {
  return prisma.product.update({
    where: { id },
    data: {
      isPublished: true,
    },
  });
};

export const unpublishProductService = async (id: string) => {
  return prisma.product.update({
    where: { id },
    data: {
      isPublished: false,
    },
  });
};
