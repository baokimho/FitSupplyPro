import { ConflictError, NotFoundError } from "@shared/utils";

import prisma from "../config/db.js";
import type {
  CategoryInput,
  UpdateCategoryInput,
} from "../validations/category.schema.js";

export const createCategoryService = async (body: CategoryInput) => {
  const existingCategory = await prisma.category.findFirst({
    where: {
      OR: [{ name: body.name }, { slug: body.slug }],
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (existingCategory) {
    const field = existingCategory.name === body.name ? "name" : "slug";
    throw new ConflictError(`Category ${field} already exists`, {
      field,
      value: field === "name" ? body.name : body.slug,
    });
  }

  return prisma.category.create({
    data: body,
  });
};

export const getAllCategoriesService = async () => {
  return prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getCategoryByIdService = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  return category;
};

export const updateCategoryService = async (
  id: string,
  data: UpdateCategoryInput,
) => {
  const category = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  if (data.name || data.slug) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: {
          not: id,
        },
        OR: [
          ...(data.name ? [{ name: data.name }] : []),
          ...(data.slug ? [{ slug: data.slug }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (existingCategory) {
      const field = data.name && existingCategory.name === data.name ? "name" : "slug";
      throw new ConflictError(`Category ${field} already exists`, {
        field,
        value: field === "name" ? data.name : data.slug,
      });
    }
  }

  return prisma.category.update({
    where: {
      id,
    },
    data,
  });
};

export const deleteCategoryService = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  await prisma.category.delete({
    where: {
      id,
    },
  });
};
