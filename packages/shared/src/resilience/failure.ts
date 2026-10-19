import { HttpError, ServiceUnavailableError } from "../errors/httpErrors.js";
import { IntegrationEventError } from "../events/boundary.js";

export type FailureClass = "transient" | "permanent" | "ambiguous" | "cancelled";
const transientCode = /^(ECONNRESET|ECONNREFUSED|EPIPE|EAI_AGAIN|ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT|P1001|P1002|P1008|P1017|P2024|P2034|08\w{3}|40001|40P01|53300|57P0[123])$/;
const field = (value: unknown, name: string): unknown => typeof value === "object" && value !== null && name in value ? (value as Record<string, unknown>)[name] : undefined;

/** Outcome may be unknown; retry eligibility also requires an operation safety decision. */
export class DependencyError extends ServiceUnavailableError {
  constructor(public readonly dependency: string, public readonly operation: string,
    public readonly failureClass: FailureClass, public readonly retrySafe: boolean,
    public readonly timeoutMs?: number, cause?: unknown) {
    super("Dependency unavailable", { dependency, operation, failureClass, timeoutMs }, "SERVICE_UNAVAILABLE", cause);
  }
}

export function classifyFailure(error: unknown): FailureClass {
  if (error instanceof DependencyError) return error.failureClass;
  if (error instanceof IntegrationEventError) return "permanent";
  if (error instanceof HttpError && error.status >= 500 && error.cause) return classifyFailure(error.cause);
  if (error instanceof HttpError) {
    const upstreamStatus = field(error.details, "statusCode") ?? field(error.details, "status");
    const status = error.status >= 500 && typeof upstreamStatus === "number" ? upstreamStatus : error.status;
    return [502, 503, 504].includes(status) ? "transient" : "permanent";
  }
  if (error instanceof Error && error.name === "AbortError") return "cancelled";
  const code = field(error, "code");
  if (typeof code === "string" && transientCode.test(code)) return "transient";
  if (code === "P2010") {
    const meta = field(error, "meta");
    const databaseCode = field(meta, "code") ?? field(field(field(meta, "driverAdapterError"), "cause"), "originalCode");
    if (typeof databaseCode === "string" && transientCode.test(databaseCode)) return "transient";
  }
  return "permanent";
}

export function canRetry(error: unknown, safe: boolean): boolean {
  if (error instanceof HttpError && !(error instanceof DependencyError) && error.status >= 500 && error.cause) return canRetry(error.cause, safe);
  if (!safe || error instanceof DependencyError && !error.retrySafe) return false;
  return ["transient", "ambiguous"].includes(classifyFailure(error));
}
