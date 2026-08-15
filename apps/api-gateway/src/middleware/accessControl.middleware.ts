import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "@shared/utils";

export function requireRole(role: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      throw new ForbiddenError();
    }

    next();
  };
}

export function blockInternalRoute(req: Request, _res: Response, _next: NextFunction) {
  if (req.path === "/internal" || req.path.startsWith("/internal/")) {
    throw new ForbiddenError();
  }

  _next();
}
