import type { Request, Response, NextFunction } from "express";
import HttpError from "../errors/httpErrors.js";
import { ZodError } from "zod";
import { isAuthTokenError } from "../auth/jwt.js";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getPrismaErrorCode(err: unknown): string | undefined {
  // Generated Prisma clients may use separate runtime copies.
  if (!(err instanceof Error) || !("clientVersion" in err) || typeof err.clientVersion !== "string") {
    return undefined;
  }

  if (err.name === "PrismaClientInitializationError") {
    return "errorCode" in err && typeof err.errorCode === "string" ? err.errorCode : undefined;
  }

  if (err.name !== "PrismaClientKnownRequestError" || !("code" in err) || typeof err.code !== "string") {
    return undefined;
  }

  // Prisma 7 raw queries wrap driver-adapter failures as P2010.
  if (err.code === "P2010" && "meta" in err && isObject(err.meta)) {
    const adapter = err.meta.driverAdapterError;
    if (isObject(adapter) && adapter.name === "DriverAdapterError" && isObject(adapter.cause)) {
      if (typeof adapter.cause.kind === "string" && ["AuthenticationFailed", "DatabaseNotReachable", "SocketTimeout", "DatabaseAccessDenied", "TlsConnectionError", "ConnectionClosed"].includes(adapter.cause.kind)) {
        return "P1001";
      }
    }
  }

  return err.code;
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

  try {
    if (err instanceof ZodError) {
      status = 400;
      code = "VALIDATION_ERROR";
      message = "Validation error";
      details = err.issues.map(({ code, path, message }) => ({ code, path, message }));
    } else if (err instanceof HttpError) {
      status = err.status;
      code = err.code;
      message = err.message;
      details = err.details;
    } else {
      switch (getPrismaErrorCode(err)) {
        case "P2002": // Unique constraint failed
          status = 409;
          code = "CONFLICT";
          message = "Unique constraint failed";
          break;
        case "P2025":
          status = 404;
          code = "NOT_FOUND";
          message = "Resource not found";
          break;
        case "P1001": // Can't reach database
        case "P1000":
        case "P1002":
        case "P1008":
        case "P1010":
        case "P1011":
        case "P1017":
        case "P2024":
          status = 503;
          code = "SERVICE_UNAVAILABLE";
          message = "Database unavailable";
          break;
      }

      if (isAuthTokenError(err)) {
        status = 401;
        code = "UNAUTHORIZED";
        message = "Unauthorized";
      }
    }
  } catch {
    // Throwing getters/proxies on unexpected errors must not break the handler.
    status = 500;
    code = "INTERNAL_ERROR";
    message = "Internal server error";
    details = undefined;
  }

  const publicDetails = details === undefined ? {} : { details };
  res.status(status).json({
    error: { code, message, ...publicDetails },
  });
}
