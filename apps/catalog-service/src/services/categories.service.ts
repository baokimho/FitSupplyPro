import { NotFoundError } from "@shared/utils";

import prisma from "../config/db.js";
import type {
  CategoryInput,
  UpdateCategoryInput,
} from "../validations/category.schema.js";

export const createCategoryService = async (body: CategoryInput) => {
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
