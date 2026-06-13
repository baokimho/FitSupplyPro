import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getParam } from "../utils/getParam.js";
import type { BrandInput, UpdateBrandInput, BrandParams } from "../validations/brand.schema.js";
import {
  createBrandService,
  deleteBrandService,
  getAllBrandsService,
  getBrandByIdService,
  updateBrandService,
} from "../services/brands.service.js";

export const createBrand = async (req: Request<{}, {}, BrandInput>, res: Response) => {
  const brand = await createBrandService(req.body);
  res.status(StatusCodes.CREATED).json({ success: true, data: brand });
};

export const getAllBrands = async (_req: Request, res: Response) => {
  const brands = await getAllBrandsService();
  res.json({ success: true, data: brands });
};

export const getBrandById = async (req: Request<BrandParams>, res: Response) => {
  const brand = await getBrandByIdService(getParam(req, "id"));
  res.json({ success: true, data: brand });
};

export const updateBrand = async (
  req: Request<BrandParams, unknown, UpdateBrandInput>,
  res: Response,
) => {
  const updated = await updateBrandService(getParam(req, "id"), req.body);
  res.json({ success: true, data: updated });
};

export const deleteBrand = async (req: Request<BrandParams>, res: Response) => {
  await deleteBrandService(getParam(req, "id"));
  res.json({ success: true, message: "Brand deleted successfully" });
};
