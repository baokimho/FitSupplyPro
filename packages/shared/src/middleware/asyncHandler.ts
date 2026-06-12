import type { NextFunction, Request, RequestHandler, Response } from "express";

export function wrapAsync(
  fn: (...args: any[]) => any,
): RequestHandler<any, any, any, any, any> {
  return function (req: Request, res: Response, next: NextFunction) {
    // Ensure returned promise rejections are passed to next()
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default wrapAsync;
