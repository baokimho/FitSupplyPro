import { BadRequestError } from "@shared/utils";
import { maxOrderQuantity } from "../validations/order.schema.js";
import type { CreateOrderInput } from "../validations/order.schema.js";

export function aggregateOrderItems(items: CreateOrderInput["items"]): Map<string, number> {
  const quantities = new Map<string, number>();
  for (const item of items) {
    const quantity = (quantities.get(item.productId) ?? 0) + item.quantity;
    if (quantity > maxOrderQuantity) {
      throw new BadRequestError("Quantity is too large", { productId: item.productId });
    }
    quantities.set(item.productId, quantity);
  }
  return quantities;
}
