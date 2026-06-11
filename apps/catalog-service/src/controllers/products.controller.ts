import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import {
  createProductService,
  deleteProductService,
  getAllProductsService,
  getProductByIdService,
  updateProductService,
} from "../services/products.service.js";
import { getParam } from "../utils/getParam.js";

export const createProduct = async (req: Request, res: Response) => {
  const product = await createProductService(req.body);

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: product,
  });
};

export const getAllProducts = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const results = await getAllProductsService();
  
  res.json({
    success: true,
    data: results.products,
    pagination: results.pagination
  });
};

export const getProductById = async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const product = await getProductByIdService(id);

  res.json({
    success: true,
    data: product,
  });
};

export const updateProduct = async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  const updated = await updateProductService(id, req.body);

  res.json({
    success: true,
    data: updated,
  });
};

export const deleteProduct = async (req: Request, res: Response) => {
  const id = getParam(req, "id");
  await deleteProductService(id);

  res.json({
    success: true,
    message: "Product deleted successfully",
  });
};
