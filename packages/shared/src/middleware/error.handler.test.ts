import express, { type Request, type Response } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { errors, jwtVerify, SignJWT } from "jose";
import {
  PrismaClientKnownRequestError,
  PrismaClientInitializationError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/client.js";
import { DriverAdapterError } from "@prisma/driver-adapter-utils";
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
    { prismaCode: "P2025", status: 404, code: "NOT_FOUND", message: "Resource not found" },
    ...["P1000", "P1001", "P1002", "P1008", "P1010", "P1011", "P1017", "P2024"].map((prismaCode) => ({ prismaCode, status: 503, code: "SERVICE_UNAVAILABLE", message: "Database unavailable" })),
    ...["P9999", "P2003", "P2021", "P2028", "P2010"].map((prismaCode) => ({ prismaCode, status: 500, code: "INTERNAL_ERROR", message: "Internal server error" })),
  ])("preserves Prisma $prismaCode status with safe envelope", async ({ prismaCode, status, code, message }) => {
    const error = new PrismaClientKnownRequestError("private Prisma internals DATABASE_URL SQL credentials", {
      code: prismaCode, clientVersion: "7.8.0", meta: { target: "private_column" },
    });
    const response = await respondWith(error);
    expect(response.status).toBe(status);
    expect(response.body).toEqual({ message, error: { code, message } });
    expect(console.error).toHaveBeenCalledWith("Error handled:", error);
  });

  it.each([
    new errors.JWTExpired("private JWT internals", { sub: "private-user", token: "private-token" }),
    new errors.JWTClaimValidationFailed("private claims", { sub: "private-user" }, "aud", "check_failed"),
    new errors.JWTInvalid("private token"),
    new errors.JWSInvalid("private JWS"),
    new errors.JOSEAlgNotAllowed("private algorithm"),
    new errors.JWSSignatureVerificationFailed("private signature"),
  ])("normalizes real token errors without exposing internals", async (error) => {
    const response = await respondWith(error);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Unauthorized", error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
    expect(console.error).toHaveBeenCalledWith("Error handled:", error);
  });

  it.each(["P1000", "P1001", "P1002", "P1008", "P1010", "P1011", "P1017", "P2024"])("normalizes Prisma initialization %s connectivity errors", async (errorCode) => {
    const error = new PrismaClientInitializationError("private host credentials DATABASE_URL", "7.8.0", errorCode);
    const response = await respondWith(error);
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ message: "Database unavailable", error: { code: "SERVICE_UNAVAILABLE", message: "Database unavailable" } });
    expect(console.error).toHaveBeenCalledWith("Error handled:", error);
  });

  it.each(["AuthenticationFailed", "DatabaseNotReachable", "SocketTimeout", "DatabaseAccessDenied", "TlsConnectionError", "ConnectionClosed"])("normalizes raw-query adapter connectivity %s", async (kind) => {
    const error = new PrismaClientKnownRequestError("private raw SQL failure", {
      code: "P2010", clientVersion: "7.8.0",
      meta: { driverAdapterError: { name: "DriverAdapterError", cause: { kind, originalMessage: "private SQL" } } },
    });
    const response = await respondWith(error);
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ message: "Database unavailable", error: { code: "SERVICE_UNAVAILABLE", message: "Database unavailable" } });
  });

  it.each([
    new PrismaClientInitializationError("private setup failure", "7.8.0"),
    new PrismaClientInitializationError("private setup failure", "7.8.0", "P1012"),
    new PrismaClientUnknownRequestError("private ORM failure", { clientVersion: "7.8.0" }),
    new PrismaClientValidationError("private ORM validation", { clientVersion: "7.8.0" }),
    new PrismaClientKnownRequestError("private raw SQL", { code: "P2010", clientVersion: "7.8.0", meta: { driverAdapterError: { name: "DriverAdapterError", cause: { kind: "postgres", originalCode: "42601" } } } }),
    new PrismaClientKnownRequestError("private raw SQL", { code: "P2010", clientVersion: "7.8.0", meta: { driverAdapterError: null } }),
    { code: "P2002" },
    { name: "PrismaClientKnownRequestError", code: "P2002" },
    Object.assign(new Error("unrelated code"), { code: "P2002" }),
    Object.assign(new Error("unrelated name"), { name: "JWTExpired" }),
    Object.assign(new Error("unrelated name"), { name: "MyJWTDatabaseFailure" }),
    Object.assign(new Error("unused library name"), { name: "JsonWebTokenError" }),
    new errors.JOSEError("private library failure"),
    new errors.JWKInvalid("private key setup"),
    new errors.JWKSInvalid("private JWKS"),
    new errors.JWKSTimeout("private key fetch"),
    new errors.JOSENotSupported("private runtime feature"),
  ])("keeps unknown, malformed and infrastructure errors safe", async (error) => {
    const response = await respondWith(error);
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Internal server error", error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
    expect(console.error).toHaveBeenCalledWith("Error handled:", error);
  });

  it.each(["getter", "proxy"])("handles throwing %s without losing safe response", (kind) => {
    const error = kind === "getter"
      ? Object.defineProperty(new Error("throwing property"), "clientVersion", { get() { throw new Error("private getter"); } })
      : new Proxy({}, { getPrototypeOf() { throw new Error("private proxy"); } });
    const res = { status: vi.fn(), json: vi.fn() };
    res.status.mockReturnValue(res);
    expect(() => errorHandler(error, {} as Request, res as unknown as Response, vi.fn())).not.toThrow();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error", error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
    expect(vi.mocked(console.error).mock.calls[0][1]).toBe(error);
  });

  it.each([null, undefined, false, 42, Symbol("private"), 42n])("handles non-Error values directly", (error) => {
    const res = { status: vi.fn(), json: vi.fn() };
    res.status.mockReturnValue(res);
    errorHandler(error, {} as Request, res as unknown as Response, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal server error", error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
  });

  it("recognizes Prisma runtime errors without requiring meta", async () => {
    const error = new PrismaClientKnownRequestError("private unique constraint", { code: "P2002", clientVersion: "7.8.0" });
    const response = await respondWith(error);
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ message: "Unique constraint failed", error: { code: "CONFLICT", message: "Unique constraint failed" } });
  });

  it("recognizes actual Prisma driver-adapter errors inside raw-query metadata", async () => {
    const adapter = new DriverAdapterError({ kind: "DatabaseNotReachable", host: "private-host", port: 5432 });
    const error = new PrismaClientKnownRequestError("private raw SQL", { code: "P2010", clientVersion: "7.8.0", meta: { driverAdapterError: adapter } });
    const response = await respondWith(error);
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ message: "Database unavailable", error: { code: "SERVICE_UNAVAILABLE", message: "Database unavailable" } });
  });

  it("removes custom validation input and schema params", async () => {
    const error = new z.ZodError([{ code: "custom", path: ["quantity"], message: "Invalid quantity", input: "private-input", params: { schema: "private-schema" } }]);
    const response = await respondWith(error);
    expect(response.body.details).toEqual([{ code: "custom", path: ["quantity"], message: "Invalid quantity" }]);
  });

  it.each(["expired", "signature", "malformed"])("normalizes actual jwtVerify %s failures", async (kind) => {
    const key = new Uint8Array(32).fill(1);
    const signingKey = kind === "signature" ? new Uint8Array(32).fill(2) : key;
    const token = kind === "malformed" ? "private-invalid-token" : await new SignJWT({ sub: "private-user" })
      .setProtectedHeader({ alg: "HS256" }).setExpirationTime(kind === "expired" ? 1 : "5m").sign(signingKey);
    const error = await jwtVerify(token, key).catch((error: unknown) => error);
    expect(error).toBeInstanceOf(errors.JOSEError);
    const response = await respondWith(error);
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: "Unauthorized", error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  });
});
