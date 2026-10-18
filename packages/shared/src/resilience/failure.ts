import { HttpError, ServiceUnavailableError } from "../errors/httpErrors.js";
import { IntegrationEventError } from "../events/boundary.js";

export type FailureClass = "transient" | "permanent" | "ambiguous" | "cancelled";

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
  if (error instanceof HttpError) return [502, 503, 504].includes(error.status) ? "transient" : "permanent";
  if (error instanceof Error && error.name === "AbortError") return "cancelled";
  const code = typeof error === "object" && error !== null && "code" in error ? error.code : undefined;
  if (typeof code === "string" && /^(ECONNRESET|ECONNREFUSED|EPIPE|EAI_AGAIN|ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT|P1001|P1002|P1008|P1017|P2024|P2034|08\w{3}|40001|40P01|53300|57P0[123])$/.test(code)) return "transient";
  return "permanent";
}

export function canRetry(error: unknown, safe: boolean): boolean {
  if (!safe || error instanceof DependencyError && !error.retrySafe) return false;
  return ["transient", "ambiguous"].includes(classifyFailure(error));
}
