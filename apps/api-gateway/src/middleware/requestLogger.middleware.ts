import type { NextFunction, Request, Response } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const userId = req.user?.id;
    const userLabel = userId ? ` user=${userId}` : "";

    console.log(
      `[api-gateway] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms${userLabel}`,
    );
  });

  next();
}