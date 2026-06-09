import { Request, Response } from "express";

import { NotFoundError } from "@shared/utils";
import prisma from "../config/db.js";
import type { CategoryInput } from "../validations/category.schema.js";

export const createCategory = async (req: Request, res: Response) => {
  const body = req.body as CategoryInput;
  const category = await prisma.category.create({
    data: body,
  });

  res.status(201).json({
    success: true,
    data: category,
  });
};

export const getAllCategories = async (req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json({
    success: true,
    data: categories,
  });
};

export const getCategoryById = async (req: Request, res: Response) => {
  const category = await prisma.category.findUnique({
    where: {
      id: req.params.id,
    },
  });

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  res.json({
    success: true,
    data: category,
  });
};

export const updateCategory = async (req: Request, res: Response) => {
  const category = await prisma.category.findUnique({
    where: {
      id: req.params.id,
    },
  });

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  const updated = await prisma.category.update({
    where: {
      id: req.params.id,
    },
    data: req.body,
  });

  res.json({
    success: true,
    data: updated,
  });
};

export const deleteCategory = async (req: Request, res: Response) => {
  const category = await prisma.category.findUnique({
    where: {
      id: req.params.id,
    },
  });

  if (!category) {
    throw new NotFoundError("Category not found");
  }

  await prisma.category.delete({
    where: {
      id: req.params.id,
    },
  });

  res.json({
    success: true,
    message: "Category deleted successfully",
  });
};
