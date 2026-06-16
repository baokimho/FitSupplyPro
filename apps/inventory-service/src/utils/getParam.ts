import type { Request } from "express";
import { BadRequestError } from "@shared/utils";

export const getParam = <T extends Record<string, string>>(
  req: Request<T>,
  key: keyof T & string,
): string => {
  const value = req.params[key];

  if (!value || Array.isArray(value)) {
    throw new BadRequestError(`Invalid param: ${key}`);
  }

  return value;
};
