import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getParam } from "@shared/utils";
import {
  cancelOrderService,
  confirmOrderService,
  createOrderService,
  getMyOrdersService,
  getOrderByIdService,
} from "../services/order.service.js";
import type { CreateOrderInput, OrderParamsInput } from "../validations/order.schema.js";

const getUserId = (req: Request) => {
  const userId = req.orderUser?.id;

  if (!userId) {
    throw new Error("Missing order user");
  }

  return userId;
};

export const createOrder = async (req: Request<{}, {}, CreateOrderInput>, res: Response) => {
  const order = await createOrderService(getUserId(req), req.body);
  res.status(StatusCodes.CREATED).json(order);
};

export const getMyOrders = async (req: Request, res: Response) => {
  const orders = await getMyOrdersService(getUserId(req));
  res.status(StatusCodes.OK).json({ items: orders });
};

export const getOrderById = async (req: Request<OrderParamsInput>, res: Response) => {
  const order = await getOrderByIdService(getParam(req, "id"), getUserId(req));
  res.status(StatusCodes.OK).json(order);
};

export const cancelOrder = async (req: Request<OrderParamsInput>, res: Response) => {
  const order = await cancelOrderService(getParam(req, "id"), getUserId(req));
  res.status(StatusCodes.OK).json(order);
};

export const confirmOrder = async (req: Request<OrderParamsInput>, res: Response) => {
  const order = await confirmOrderService(getParam(req, "id"), getUserId(req));
  res.status(StatusCodes.OK).json(order);
};
