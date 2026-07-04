import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getParam } from "@shared/utils";
import {
  addCartItemService,
  clearCartService,
  deleteCartItemService,
  getUserCartOrEmpty,
  updateCartItemService,
} from "../services/cart.service.js";
import type {
  AddCartItemInput,
  CartItemParamsInput,
  UpdateCartItemInput,
} from "../validations/cart.schema.js";

const getUserId = (req: Request) => {
  const userId = req.cartUser?.id;

  if (!userId) {
    throw new Error("Missing cart user");
  }

  return userId;
};

export const getCart = async (req: Request, res: Response) => {
  const cart = await getUserCartOrEmpty(getUserId(req));
  res.status(StatusCodes.OK).json(cart);
};

export const addCartItem = async (req: Request<{}, {}, AddCartItemInput>, res: Response) => {
  const cart = await addCartItemService(getUserId(req), req.body);
  res.status(StatusCodes.CREATED).json(cart);
};

export const updateCartItem = async (
  req: Request<CartItemParamsInput, {}, UpdateCartItemInput>,
  res: Response,
) => {
  const cart = await updateCartItemService(getUserId(req), getParam(req, "id"), req.body);
  res.status(StatusCodes.OK).json(cart);
};

export const deleteCartItem = async (req: Request<CartItemParamsInput>, res: Response) => {
  const cart = await deleteCartItemService(getUserId(req), getParam(req, "id"));
  res.status(StatusCodes.OK).json(cart);
};

export const clearCart = async (req: Request, res: Response) => {
  const cart = await clearCartService(getUserId(req));
  res.status(StatusCodes.OK).json(cart);
};
