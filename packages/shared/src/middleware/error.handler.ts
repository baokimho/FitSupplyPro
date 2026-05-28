import type { Request, Response, NextFunction } from "express";
import HttpError from "../errors/httpErrors.js";

type PrismaLikeError = {
  code?: string;
  meta?: { target?: unknown };
};

function isPrismaError(err: unknown): err is PrismaLikeError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as any).code === "string"
  );
}

export default function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let status = 500;
  let message = "Internal Server Error";
  let details: unknown = undefined;

  try {
    console.error("Error handled:", err);
  } catch {
    // ignore
  }

  if (err instanceof HttpError) {
    status = err.status;
    message = err.message;
    details = err.details;
    return res.status(status).json({ message, details });
  }

  if (err instanceof Error) {
    message = err.message || message;
  }

  // Prisma known request errors (e.g. unique constraint)
  if (isPrismaError(err)) {
    switch (err.code) {
      case "P2002": // Unique constraint failed
        status = 409;
        message = `Unique constraint failed: ${err.meta?.target || "field"}`;
        break;
      case "P1001": // Can't reach database
      case "P1000":
      case "P1010":
        status = 503;
        message = "Database unavailable";
        break;
      default:
        status = 400;
        break;
    }
  }

  // JOSE / JWT style errors (lightweight detection)
  if (typeof err === "object" && err !== null && "name" in err) {
    const name = (err as any).name as string;
    if (name && (name.includes("JWT") || name.includes("JsonWebTokenError") || name.includes("TokenExpiredError"))) {
      status = 401;
      // keep message from error if present
    }
  }

  res.status(status).json({
    message,
  });
}
