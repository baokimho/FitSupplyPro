import { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { wrapAsync } from "./asyncHandler.js";

export const validateRequest = (schema: z.ZodTypeAny) => {
  return wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
    await schema.parseAsync(req.body);
    next();
  });
};
