import { randomUUID } from "node:crypto";
import { afterEach, expect, it, vi } from "vitest";
import { createIntegrationEvent, serializeIntegrationEvent } from "../events/boundary.js";
import { createLogger } from "../logging/logger.js";
import { enqueueOutboxEvent, startOutboxPublisher, type OutboxDatabase, type OutboxTransaction } from "./outbox.js";

const logger = createLogger({ service: "outbox-test", environment: "test", level: "silent" });
const event = () => createIntegrationEvent({ eventType: "order.confirmed", correlationId: randomUUID(), causationId: randomUUID(), data: { orderId: randomUUID(), userId: "user" } });
function database() {
  const tx: OutboxTransaction = { $queryRaw: vi.fn().mockResolvedValue([]), outboxEvent: {
    findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn(), update: vi.fn().mockResolvedValue({}),
  } };
  const db: OutboxDatabase = { $transaction: async (work) => work(tx) };
  return { db, tx };
}
afterEach(() => { vi.useRealTimers(); });

it("retains first event identity on keyed application replay and rejects changed intent", async () => {
  const { tx } = database();
  const first = event();
  vi.mocked(tx.outboxEvent.upsert).mockResolvedValue({ payload: serializeIntegrationEvent(first).toString("utf8") });
  expect(await enqueueOutboxEvent(tx, { ...first, eventId: randomUUID() }, "payment-result-key")).toEqual(first);
  await expect(enqueueOutboxEvent(tx, { ...first, data: { ...first.data, userId: "other" } }, "payment-result-key")).rejects.toThrow("Outbox operation reused");
});
it("rejects event ID reuse with different envelope content", async () => {
  const { tx } = database();
  const first = event();
  vi.mocked(tx.outboxEvent.findUnique).mockResolvedValue({ payload: serializeIntegrationEvent(first).toString("utf8") });
  expect(await enqueueOutboxEvent(tx, first)).toEqual(first);
  await expect(enqueueOutboxEvent(tx, { ...first, causationId: randomUUID() })).rejects.toThrow("Outbox event ID reused");
});
it("stops polling without leaking timer handles", async () => {
  vi.useFakeTimers();
  const { db, tx } = database();
  const worker = startOutboxPublisher(db, vi.fn(), logger);
  await vi.advanceTimersByTimeAsync(0);
  expect(tx.$queryRaw).toHaveBeenCalledOnce();
  expect(vi.getTimerCount()).toBe(1);
  await worker.close();
  expect(vi.getTimerCount()).toBe(0);
  await vi.advanceTimersByTimeAsync(1000);
  expect(tx.$queryRaw).toHaveBeenCalledOnce();
});
it("shutdown waits for in-flight confirmation and published marker, without scheduling more work", async () => {
  const { db, tx } = database();
  const first = event();
  vi.mocked(tx.$queryRaw).mockResolvedValue([{ id: randomUUID(), payload: serializeIntegrationEvent(first).toString("utf8"), attempts: 0 }]);
  let confirm!: () => void;
  const publish = vi.fn(() => new Promise<void>((resolve) => { confirm = resolve; }));
  const worker = startOutboxPublisher(db, publish, logger);
  await vi.waitFor(() => expect(publish).toHaveBeenCalledOnce());
  let closed = false;
  const close = worker.close().then(() => { closed = true; });
  expect(closed).toBe(false);
  expect(vi.mocked(tx.outboxEvent.update).mock.calls.some(([args]) => args.data.publishedAt)).toBe(false);
  confirm();
  await close;
  expect(closed).toBe(true);
  expect(vi.mocked(tx.outboxEvent.update).mock.calls.some(([args]) => args.data.publishedAt)).toBe(true);
  expect(tx.$queryRaw).toHaveBeenCalledOnce();
});
