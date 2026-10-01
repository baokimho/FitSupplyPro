export class HttpError extends Error {
  public status: number;
  public code: string;
  public details?: unknown;
  public cause?: unknown;

  constructor(status: number, message: string, details?: unknown, code = "INTERNAL_ERROR", cause?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.cause = cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "Bad Request", details?: unknown, code = "BAD_REQUEST", cause?: unknown) {
    super(400, message, details, code, cause);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized", details?: unknown, code = "UNAUTHORIZED", cause?: unknown) {
    super(401, message, details, code, cause);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden", details?: unknown, code = "FORBIDDEN", cause?: unknown) {
    super(403, message, details, code, cause);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Not Found", details?: unknown, code = "NOT_FOUND", cause?: unknown) {
    super(404, message, details, code, cause);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Conflict", details?: unknown, code = "CONFLICT", cause?: unknown) {
    super(409, message, details, code, cause);
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message = "Service Unavailable", details?: unknown, code = "SERVICE_UNAVAILABLE", cause?: unknown) {
    super(503, message, details, code, cause);
  }
}

export default HttpError;
