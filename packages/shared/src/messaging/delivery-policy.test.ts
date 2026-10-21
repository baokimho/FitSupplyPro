import { expect, it } from "vitest";
import { ConflictError, ServiceUnavailableError } from "../errors/httpErrors.js";
import { IntegrationEventError } from "../events/boundary.js";
import { DeliveryPoisonError, DeliveryBudgetExhausted, deliveryFailureClass, deliveryDiagnostic, replayCount } from "./delivery-policy.js";
import type { ConsumeMessage } from "amqplib";
import { canRetry, classifyFailure } from "../resilience/failure.js";

it("refines Phase 11 classification without retrying poison/business failures", () => {
  expect(deliveryFailureClass(new IntegrationEventError("MALFORMED_JSON"))).toBe("POISON");
  expect(deliveryFailureClass(new DeliveryPoisonError())).toBe("POISON");
  expect(deliveryFailureClass(new ConflictError("invalid transition"))).toBe("PERMANENT");
  expect(deliveryFailureClass(new ServiceUnavailableError())).toBe("TRANSIENT");
  expect(deliveryFailureClass(new DeliveryBudgetExhausted())).toBe("TRANSIENT");
  expect(classifyFailure(new DeliveryBudgetExhausted())).toBe("transient");
  expect(canRetry(new DeliveryBudgetExhausted(), true)).toBe(false);
});
it("diagnostics never copy poison bytes, credentials, arbitrary messages or stacks", () => {
  const message = { content: Buffer.from("password=private"), fields: { routingKey: "order.created" }, properties: {} } as ConsumeMessage;
  const diagnostic = deliveryDiagnostic("inventory.order-created", message, new Error("Bearer secret postgres://u:p@host/private"), 3, 3);
  expect(diagnostic).toMatchObject({ attempt: 3, retryCount: 2, failureClass: "PERMANENT", queue: "inventory.order-created" });
  expect(JSON.stringify(diagnostic)).not.toMatch(/private|Bearer|postgres|stack|password/);
  expect(replayCount(message)).toBe(0);
  expect(() => replayCount({ ...message, properties: { ...message.properties, headers: { "x-fitsupply-replay-count": 99 } } })).toThrow();
});
