import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { wrapAsync } from "./asyncHandler.js";

type RequestInputType = "body" | "query" | "params";

export const validateRequest = <T extends z.ZodTypeAny>(
  inputType: RequestInputType,
  schema: T,
) => {
  return wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
    const parsed = await schema.parseAsync(req[inputType]);

    (req as Request & Record<RequestInputType, unknown>)[inputType] = parsed;

    next();
  });
};
