import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  adjustInventoryStockService,
  createInventoryService,
  getInventoriesByProductIdsService,
  getInventoryByProductIdService,
  updateInventoryByProductIdService,
} from "../services/inventory.service.js";
import { getParam } from "../utils/getParam.js";
import type {
  AdjustInventoryInput,
  BatchInventoryInput,
  CreateInventoryInput,
  InventoryProductParams,
  UpdateInventoryInput,
} from "../validations/inventory.schema.js";

export const createInventory = async (
  req: Request<{}, {}, CreateInventoryInput>,
  res: Response,
) => {
  const inventory = await createInventoryService(req.body);
  res.status(StatusCodes.CREATED).json(inventory);
};

export const getInventoryByProductId = async (
  req: Request<InventoryProductParams>,
  res: Response,
) => {
  const inventory = await getInventoryByProductIdService(getParam(req, "productId"));
  res.status(StatusCodes.OK).json(inventory);
};

export const updateInventoryByProductId = async (
  req: Request<InventoryProductParams, {}, UpdateInventoryInput>,
  res: Response,
) => {
  const inventory = await updateInventoryByProductIdService(
    getParam(req, "productId"),
    req.body,
  );

  res.status(StatusCodes.OK).json(inventory);
};

export const getInventoriesByProductIds = async (
  req: Request<{}, {}, BatchInventoryInput>,
  res: Response,
) => {
  const items = await getInventoriesByProductIdsService(req.body);
  res.status(StatusCodes.OK).json({ items });
};

export const adjustInventoryStock = async (
  req: Request<InventoryProductParams, {}, AdjustInventoryInput>,
  res: Response,
) => {
  const inventory = await adjustInventoryStockService(getParam(req, "productId"), req.body);
  res.status(StatusCodes.OK).json(inventory);
};
