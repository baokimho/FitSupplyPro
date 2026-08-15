import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, getParam } from "@shared/utils";
import {
  confirmPaymentService,
  createPaymentService,
  failPaymentService,
  getMyPaymentsService,
  getPaymentByIdService,
  refundPaymentService,
} from "../services/payment.service.js";
import type { CreatePaymentInput, PaymentParamsInput } from "../validations/payment.schema.js";

const idempotencyKeyPattern = /^[A-Za-z0-9._:-]{1,128}$/;

const getUserId = (req: Request) => {
  const userId = req.paymentUser?.id;

  if (!userId) {
    throw new Error("Missing payment user");
  }

  return userId;
};

const getUserRole = (req: Request) => req.paymentUser?.role;

const getIdempotencyKey = (req: Request) => {
  const value = req.get("idempotency-key");

  if (!value) {
    throw new BadRequestError("Idempotency-Key header is required");
  }

  if (value.trim() !== value || !idempotencyKeyPattern.test(value)) {
    throw new BadRequestError("Idempotency-Key header is invalid");
  }

  return value;
};

export const createPayment = async (req: Request<{}, {}, CreatePaymentInput>, res: Response) => {
  const payment = await createPaymentService(getUserId(req), req.body, getIdempotencyKey(req));
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
  const payment = await confirmPaymentService(getParam(req, "id"), getUserId(req), getUserRole(req));
  res.status(StatusCodes.OK).json(payment);
};

export const failPayment = async (req: Request<PaymentParamsInput>, res: Response) => {
  const payment = await failPaymentService(getParam(req, "id"), getUserId(req), getUserRole(req));
  res.status(StatusCodes.OK).json(payment);
};

export const refundPayment = async (req: Request<PaymentParamsInput>, res: Response) => {
  const payment = await refundPaymentService(getParam(req, "id"), getUserId(req), getUserRole(req));
  res.status(StatusCodes.OK).json(payment);
};
