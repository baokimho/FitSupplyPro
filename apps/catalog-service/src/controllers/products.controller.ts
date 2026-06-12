import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import {
  createProductService,
  deleteProductService,
  getAllProductsService,
  getProductByIdService,
  updateProductService,
  publishProductService,
  unpublishProductService
} from "../services/products.service.js";
import { getParam } from "../utils/getParam.js";
import type { ProductInput, UpdateProductInput, ProductQueryInput, ProductParamsInput } from "../validations/product.schema.js";



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
  req: Request<{}, {}, {}, ProductQueryInput>,
  res: Response,
) => {
  const results = await getAllProductsService(req.query);
  
  res.json({
    success: true,
    data: results.products,
    pagination: results.pagination
  });
};

export const getProductById = async (
  req: Request<ProductParamsInput>,
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
  req: Request<ProductParamsInput, unknown, UpdateProductInput>,
  res: Response,
) => {
  const id = getParam(req, "id");
  const updated = await updateProductService(id, req.body);

  res.json({
    success: true,
    data: updated,
  });
};

export const deleteProduct = async (req: Request<ProductParamsInput>, res: Response) => {
  const id = getParam(req, "id");
  await deleteProductService(id);

  res.json({
    success: true,
    message: "Product deleted successfully",
  });
};

export const publishProduct = async (
  req: Request<ProductParamsInput>,
  res: Response,
) => {
  const product = await publishProductService(
    getParam(req, "id")
  );

  res.status(StatusCodes.OK).json(product);
};

export const unpublishProduct = async (
  req: Request<ProductParamsInput>,
  res: Response,
) => {
  const product = await unpublishProductService(
    getParam(req, "id")
  );

  res.status(StatusCodes.OK).json(product);
};