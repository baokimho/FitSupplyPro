import type { Request, Response, NextFunction, RequestHandler } from "express";

export function wrapAsync(fn: RequestHandler): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction) {
    // Ensure returned promise rejections are passed to next()
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default wrapAsync;
