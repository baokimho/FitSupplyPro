import { ServiceUnavailableError, type CheckoutPublisher, type KnownIntegrationEvent } from "@shared/utils";

let publisher: CheckoutPublisher | undefined;
export function setCheckoutPublisher(value: CheckoutPublisher) { publisher = value; }
export function publishCheckoutEvent(event: KnownIntegrationEvent) {
  if (!publisher) throw new ServiceUnavailableError("Checkout broker unavailable");
  return publisher(event);
}
