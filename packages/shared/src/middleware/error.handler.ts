import type { Request, Response, NextFunction } from "express";
import HttpError from "../errors/httpErrors.js";
import { ZodError } from "zod";

type PrismaLikeError = {
  code?: string;
};

function isPrismaError(err: unknown): err is PrismaLikeError {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof err.code === "string"
  );
}

export default function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Internal server error";
  let details: unknown = undefined;

  try {
    console.error("Error handled:", err);
  } catch {
    // ignore
  }

  if (err instanceof ZodError) {
    status = 400;
    code = "VALIDATION_ERROR";
    message = "Validation error";
    details = err.issues;
  } else if (err instanceof HttpError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else {
    // Prisma known request errors (e.g. unique constraint)
    if (isPrismaError(err)) {
      switch (err.code) {
        case "P2002": // Unique constraint failed
          status = 409;
          code = "CONFLICT";
          message = "Unique constraint failed";
          break;
        case "P1001": // Can't reach database
        case "P1000":
        case "P1010":
          status = 503;
          code = "SERVICE_UNAVAILABLE";
          message = "Database unavailable";
          break;
        default:
          status = 400;
          break;
      }
    }

    // JOSE / JWT style errors (lightweight detection)
    if (typeof err === "object" && err !== null && "name" in err) {
      const name = err.name;
      if (typeof name === "string" && (name.includes("JWT") || name.includes("JsonWebTokenError") || name.includes("TokenExpiredError"))) {
        status = 401;
        code = "UNAUTHORIZED";
        message = "Unauthorized";
      }
    }
  }

  const publicDetails = details === undefined ? {} : { details };
  res.status(status).json({
    message,
    ...publicDetails,
    error: { code, message, ...publicDetails },
  });
}
