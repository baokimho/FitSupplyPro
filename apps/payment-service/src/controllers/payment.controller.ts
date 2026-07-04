import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getParam } from "@shared/utils";
import {
  confirmPaymentService,
  createPaymentService,
  failPaymentService,
  getMyPaymentsService,
  getPaymentByIdService,
  refundPaymentService,
} from "../services/payment.service.js";
import type { CreatePaymentInput, PaymentParamsInput } from "../validations/payment.schema.js";

const getUserId = (req: Request) => {
  const userId = req.paymentUser?.id;

  if (!userId) {
    throw new Error("Missing payment user");
  }

  return userId;
};

export const createPayment = async (req: Request<{}, {}, CreatePaymentInput>, res: Response) => {
  const payment = await createPaymentService(getUserId(req), req.body);
  res.status(StatusCodes.CREATED).json(payment);
};

export const getMyPayments = async (req: Request, res: Response) => {
  const payments = await getMyPaymentsService(getUserId(req));
  res.status(StatusCodes.OK).json({ items: payments });
};

export const getPaymentById = async (req: Request<PaymentParamsInput>, res: Response) => {
  const payment = await getPaymentByIdService(getParam(req, "id"), getUserId(req));
  res.status(StatusCodes.OK).json(payment);
};

export const confirmPayment = async (req: Request<PaymentParamsInput>, res: Response) => {
  const payment = await confirmPaymentService(getParam(req, "id"), getUserId(req));
  res.status(StatusCodes.OK).json(payment);
};

export const failPayment = async (req: Request<PaymentParamsInput>, res: Response) => {
  const payment = await failPaymentService(getParam(req, "id"), getUserId(req));
  res.status(StatusCodes.OK).json(payment);
};

export const refundPayment = async (req: Request<PaymentParamsInput>, res: Response) => {
  const payment = await refundPaymentService(getParam(req, "id"), getUserId(req));
  res.status(StatusCodes.OK).json(payment);
};
