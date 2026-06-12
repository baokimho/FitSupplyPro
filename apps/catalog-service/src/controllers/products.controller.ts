import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import {
  createProductService,
  deleteProductService,
  getAllProductsService,
  getProductByIdService,
  updateProductService,
} from "../services/products.service.js";
import { getParam } from "../utils/getParam.js";
import type { ProductInput, UpdateProductInput, ProductQuery, ProductParams } from "../validations/product.schema.js";



export const createProduct = async (
  req: Request<{}, {}, ProductInput>,
  res: Response,
) => {
  const product = await createProductService(req.body);

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: product,
  });
};

export const getAllProducts = async (
  req: Request<{}, {}, {}, ProductQuery>,
  res: Response,
) => {
  const { page = 1, limit = 20 } = req.query;
  const results = await getAllProductsService(page, limit);
  
  res.json({
    success: true,
    data: results.products,
    pagination: results.pagination
  });
};

export const getProductById = async (
  req: Request<ProductParams>,
  res: Response,
) => {
  const id = getParam(req, "id");
  const product = await getProductByIdService(id);

  res.json({
    success: true,
    data: product,
  });
};

export const updateProduct = async (
  req: Request<ProductParams, unknown, UpdateProductInput>,
  res: Response,
) => {
  const id = getParam(req, "id");
  const updated = await updateProductService(id, req.body);

  res.json({
    success: true,
    data: updated,
  });
};

export const deleteProduct = async (req: Request<ProductParams>, res: Response) => {
  const id = getParam(req, "id");
  await deleteProductService(id);

  res.json({
    success: true,
    message: "Product deleted successfully",
  });
};
