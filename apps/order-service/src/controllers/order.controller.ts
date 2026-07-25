import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, getParam } from "@shared/utils";
import {
  cancelOrderService,
  confirmOrderService,
  checkoutOrderService,
  createOrderService,
  getMyOrdersService,
  getOrderByIdService,
} from "../services/order.service.js";
import type { CheckoutInput, CreateOrderInput, OrderParamsInput } from "../validations/order.schema.js";

const idempotencyKeyPattern = /^[A-Za-z0-9._:-]+$/;

const getIdempotencyKey = (req: Request) => {
  const value = req.header("Idempotency-Key");

  if (!value || value.trim().length === 0) {
    throw new BadRequestError("Idempotency-Key header is required");
  }

  if (value.length > 128 || !idempotencyKeyPattern.test(value)) {
    throw new BadRequestError("Idempotency-Key header is invalid");
  }

  return value;
};
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

export const checkoutOrder = async (req: Request<{}, {}, CheckoutInput>, res: Response) => {
  const order = await checkoutOrderService(getUserId(req), req.body, getIdempotencyKey(req));
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
