import { describe, expect, it } from "vitest";
import { BadRequestError, ConflictError, HttpError, ServiceUnavailableError } from "../errors/httpErrors.js";
import { canRetry, classifyFailure, DependencyError } from "./failure.js";

describe("failure decisions", () => {
  it.each([400, 401, 403, 404, 409, 422, 500, 501])("does not retry HTTP %s", (status) => {
    expect(canRetry(new HttpError(status, "rejected"), true)).toBe(false);
  });
  it.each([502, 503, 504])("retries HTTP %s only for safe work", (status) => {
    const error = new HttpError(status, "unavailable");
    expect(classifyFailure(error)).toBe("transient");
    expect(canRetry(error, true)).toBe(true);
    expect(canRetry(error, false)).toBe(false);
  });
  it("distinguishes ambiguous outcome from retry permission", () => {
    expect(canRetry(new DependencyError("inventory", "reserve", "ambiguous", false), true)).toBe(false);
    expect(canRetry(new DependencyError("inventory", "reserve", "ambiguous", true), true)).toBe(true);
  });
  it("recognizes infrastructure codes, cancellation, and permanent business/unknown errors", () => {
    for (const code of ["ECONNRESET", "P1001", "P2034", "08006", "40001", "57P01"]) expect(classifyFailure({ code })).toBe("transient");
    expect(classifyFailure(new DOMException("shutdown", "AbortError"))).toBe("cancelled");
    expect(classifyFailure({ code: "P2010", meta: { code: "40001" } })).toBe("transient");
    expect(classifyFailure({ code: "P2010", meta: { code: "P0001" } })).toBe("permanent");
    expect(classifyFailure(new ServiceUnavailableError("downstream", { status: 500 }))).toBe("permanent");
    for (const error of [new Error("bug"), new BadRequestError("Insufficient stock"), new ConflictError("Idempotency mismatch"), { code: "P2002" }]) expect(canRetry(error, true)).toBe(false);
  });
});
