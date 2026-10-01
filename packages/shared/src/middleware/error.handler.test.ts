import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ServiceUnavailableError,
} from "../errors/httpErrors.js";
import errorHandler from "./error.handler.js";
import { validateRequest } from "./validate.middleware.js";

const defaults = [
  { ErrorClass: BadRequestError, status: 400, code: "BAD_REQUEST", message: "Bad Request" },
  { ErrorClass: UnauthorizedError, status: 401, code: "UNAUTHORIZED", message: "Unauthorized" },
  { ErrorClass: ForbiddenError, status: 403, code: "FORBIDDEN", message: "Forbidden" },
  { ErrorClass: NotFoundError, status: 404, code: "NOT_FOUND", message: "Not Found" },
  { ErrorClass: ConflictError, status: 409, code: "CONFLICT", message: "Conflict" },
  { ErrorClass: ServiceUnavailableError, status: 503, code: "SERVICE_UNAVAILABLE", message: "Service Unavailable" },
];

function respondWith(error: unknown) {
  const app = express();
  app.get("/", (_req, _res, next) => next(error));
  app.use(errorHandler);
  return request(app).get("/");
}

describe("shared error contract", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(defaults)("$code preserves default status, message and envelope", async ({ ErrorClass, status, code, message }) => {
    const error = new ErrorClass();
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toBeInstanceOf(Error);
    expect(error.status).toBe(status);
    expect(error.code).toBe(code);
    const response = await respondWith(error);
    expect(response.status).toBe(status);
    expect(response.body).toEqual({ message, error: { code, message } });
  });

  it.each(defaults)("$code preserves existing message/details arguments", async ({ ErrorClass, status, code }) => {
    const details = { field: "id" };
    const error = new ErrorClass("Existing public message", details);
    expect(error.details).toBe(details);
    const response = await respondWith(error);
    expect(response.status).toBe(status);
    expect(response.body).toEqual({
      message: error.message, details,
      error: { code, message: error.message, details },
    });
  });

  it("supports domain code override and retains cause internally", async () => {
    const cause = new Error("private database text");
    const error = new ConflictError("Not enough inventory", { quantity: 2 }, "INSUFFICIENT_STOCK", cause);
    expect(error.cause).toBe(cause);
    expect(error.stack).toContain("Not enough inventory");
    const response = await respondWith(error);
    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: error.message, details: error.details,
      error: { code: "INSUFFICIENT_STOCK", message: error.message, details: error.details },
    });
    expect(console.error).toHaveBeenCalledWith("Error handled:", error);
  });

  it("keeps base constructor compatible and accepts explicit code", async () => {
    const error = new HttpError(418, "Existing message", { field: "id" });
    expect(error.code).toBe("INTERNAL_ERROR");
    expect((await respondWith(error)).status).toBe(418);
    const custom = new HttpError(422, "Custom message", undefined, "CUSTOM_ERROR");
    expect((await respondWith(custom)).body).toEqual({
      message: "Custom message", error: { code: "CUSTOM_ERROR", message: "Custom message" },
    });
  });

  it.each([null, false, 0, "", { field: "id" }])("includes defined details: %j", async (details) => {
    const response = await respondWith(new BadRequestError("Bad input", details));
    expect(response.body.details).toEqual(details);
    expect(response.body.error.details).toEqual(details);
  });

  it("maps validation middleware errors to safe structured details", async () => {
    const app = express();
    app.use(express.json());
    app.post("/", validateRequest("body", z.object({ quantity: z.number().positive() })), (_req, res) => res.sendStatus(204));
    app.use(errorHandler);
    const response = await request(app).post("/").send({ quantity: -1, password: "private-input" });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation error");
    expect(response.body.error).toEqual({ code: "VALIDATION_ERROR", message: "Validation error", details: response.body.details });
    expect(response.body.details).toEqual([expect.objectContaining({ code: "too_small", path: ["quantity"] })]);
    expect(JSON.stringify(response.body)).not.toContain("private-input");
  });

  it.each([
    new Error("Prisma internals at C:/private/database.ts"),
    new SyntaxError("Malformed JSON private parser message"),
    { message: "private library text", stack: "private stack" },
    "private thrown string",
  ])("hides unexpected internal errors and logs original", async (error) => {
    const response = await respondWith(error);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "Internal server error", error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
    expect(console.error).toHaveBeenCalledWith("Error handled:", error);
  });

  it("hides malformed JSON parser internals", async () => {
    const app = express();
    app.use(express.json());
    app.post("/", (_req, res) => res.sendStatus(204));
    app.use(errorHandler);
    const response = await request(app).post("/").set("Content-Type", "application/json").send('{"private":');
    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "Internal server error", error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  });

  it.each([
    { prismaCode: "P2002", status: 409, code: "CONFLICT", message: "Unique constraint failed" },
    ...["P1000", "P1001", "P1010"].map((prismaCode) => ({ prismaCode, status: 503, code: "SERVICE_UNAVAILABLE", message: "Database unavailable" })),
    { prismaCode: "P9999", status: 400, code: "INTERNAL_ERROR", message: "Internal server error" },
  ])("preserves Prisma $prismaCode status with safe envelope", async ({ prismaCode, status, code, message }) => {
    const error = Object.assign(new Error("private Prisma internals"), { code: prismaCode, meta: { target: "private_column" } });
    const response = await respondWith(error);
    expect(response.status).toBe(status);
    expect(response.body).toEqual({ message, error: { code, message } });
    expect(console.error).toHaveBeenCalledWith("Error handled:", error);
  });

  it.each(["JWTExpired", "JWTClaimValidationFailed", "JsonWebTokenError", "TokenExpiredError"])("preserves %s status with safe envelope", async (name) => {
    const response = await respondWith(Object.assign(new Error("private JWT internals"), { name }));
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Unauthorized", error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  });
});
