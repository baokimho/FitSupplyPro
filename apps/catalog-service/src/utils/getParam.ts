import type { Request } from "express";

export const getParam = <T extends Record<string, string>>(
  req: Request<T>,
  key: keyof T & string,
): string => {
  const value = req.params[key];

  if (!value || Array.isArray(value)) {
    throw new Error(`Invalid param: ${key}`);
  }

  return value;
};
