import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import {
  createCategoryService,
  deleteCategoryService,
  getAllCategoriesService,
  getCategoryByIdService,
  updateCategoryService,
} from "../services/categories.service.js";
import { getParam } from "../utils/getParam.js";
import type { CategoryInput, UpdateCategoryInput, CategoryParams } from "../validations/category.schema.js";



export const createCategory = async (
  req: Request<{}, {}, CategoryInput>,
  res: Response,
) => {
  const category = await createCategoryService(req.body);

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: category,
  });
};

export const getAllCategories = async (req: Request, res: Response) => {
  const categories = await getAllCategoriesService();

  res.json({
    success: true,
    data: categories,
  });
};

export const getCategoryById = async (
  req: Request<CategoryParams>,
  res: Response,
) => {
  const id = getParam(req, "id");
  const category = await getCategoryByIdService(id);

  res.json({
    success: true,
    data: category,
  });
};

export const updateCategory = async (
  req: Request<CategoryParams, unknown, UpdateCategoryInput>,
  res: Response,
) => {
  const id = getParam(req, "id");
  const updated = await updateCategoryService(id, req.body);

  res.json({
    success: true,
    data: updated,
  });
};

export const deleteCategory = async (req: Request<CategoryParams>, res: Response) => {
  const id = getParam(req, "id");
  await deleteCategoryService(id);

  res.json({
    success: true,
    message: "Category deleted successfully",
  });
};
