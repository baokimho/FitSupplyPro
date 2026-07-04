import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getParam } from "@shared/utils";
import {
  createShipmentService,
  getMyShipmentsService,
  getShipmentByIdService,
  updateShipmentStatusService,
} from "../services/shipping.service.js";
import type {
  CreateShipmentInput,
  ShipmentParamsInput,
  UpdateShipmentStatusInput,
} from "../validations/shipping.schema.js";

const getUserId = (req: Request) => {
  const userId = req.shippingUser?.id;

  if (!userId) {
    throw new Error("Missing shipping user");
  }

  return userId;
};

export const createShipment = async (req: Request<{}, {}, CreateShipmentInput>, res: Response) => {
  const shipment = await createShipmentService(getUserId(req), req.body);
  res.status(StatusCodes.CREATED).json(shipment);
};

export const getMyShipments = async (req: Request, res: Response) => {
  const shipments = await getMyShipmentsService(getUserId(req));
  res.status(StatusCodes.OK).json({ items: shipments });
};

export const getShipmentById = async (req: Request<ShipmentParamsInput>, res: Response) => {
  const shipment = await getShipmentByIdService(getParam(req, "id"), getUserId(req));
  res.status(StatusCodes.OK).json(shipment);
};

export const updateShipmentStatus = async (
  req: Request<ShipmentParamsInput, {}, UpdateShipmentStatusInput>,
  res: Response,
) => {
  const shipment = await updateShipmentStatusService(getParam(req, "id"), getUserId(req), req.body);
  res.status(StatusCodes.OK).json(shipment);
};
