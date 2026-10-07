import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { requireTestDatabaseUrl } from "@shared/utils";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../generated/prisma/index.js";
import { FakePaymentProvider } from "./fake-payment-provider.js";

const databaseUrl = requireTestDatabaseUrl("payment_test_db");
const pool = new pg.Pool({ connectionString: databaseUrl });
const database = new PrismaClient({ adapter: new PrismaPg(pool) });
const provider = new FakePaymentProvider(database);
const input = { paymentId: "payment-1", idempotencyKey: "payment-1:settle", amount: "19.99", currency: "USD" };

beforeAll(() => database.$connect());
beforeEach(() => database.fakeProviderOperation.deleteMany());
afterEach(() => vi.restoreAllMocks());
afterAll(async () => { await database.$disconnect(); await pool.end(); });

describe("durable fake payment provider", () => {
  it("provider error before acknowledgement moves no money", async () => {
    vi.spyOn(database, "$executeRaw").mockRejectedValueOnce(new Error("provider offline"));
    await expect(provider.settle(input, "SUCCEEDED")).rejects.toThrow("provider offline");
    expect(await database.fakeProviderOperation.count()).toBe(0);
  });

  it("lost provider response recovers durable receipt through another connection", async () => {
    vi.spyOn(database.fakeProviderOperation, "findUnique").mockRejectedValueOnce(new Error("response lost"));
    await expect(provider.settle(input, "SUCCEEDED")).rejects.toThrow("response lost");
    const otherPool = new pg.Pool({ connectionString: databaseUrl });
    const otherDatabase = new PrismaClient({ adapter: new PrismaPg(otherPool) });
    try {
      expect(await new FakePaymentProvider(otherDatabase).settle(input, "SUCCEEDED")).toMatchObject({ status: "SUCCEEDED" });
      expect(await otherDatabase.fakeProviderOperation.count()).toBe(1);
    } finally {
      await otherDatabase.$disconnect();
      await otherPool.end();
    }
  });

  it("acknowledges deterministic success and replays through another adapter instance", async () => {
    const first = await provider.settle(input, "SUCCEEDED");
    expect(first).toEqual({ status: "SUCCEEDED", reference: "fake_payment_payment-1" });
    expect(await new FakePaymentProvider(database).settle(input, "SUCCEEDED")).toEqual(first);
    expect(await database.fakeProviderOperation.count()).toBe(1);
  });

  it("declines deterministically and rejects opposite outcome or changed amount", async () => {
    expect(await provider.settle(input, "FAILED")).toMatchObject({ status: "FAILED", failureCode: "FAKE_DECLINED" });
    await expect(provider.settle(input, "SUCCEEDED")).rejects.toMatchObject({ status: 409 });
    await expect(provider.settle({ ...input, amount: "0.01" }, "FAILED")).rejects.toMatchObject({ status: 409 });
    expect(await database.fakeProviderOperation.count()).toBe(1);
  });

  it("full refund replays concurrently with one durable refund receipt", async () => {
    const payment = await provider.settle(input, "SUCCEEDED");
    const refund = { ...input, idempotencyKey: "payment-1:refund", providerPaymentId: payment.reference };
    const results = await Promise.all([provider.refund(refund), new FakePaymentProvider(database).refund(refund)]);
    expect(results).toEqual([{ reference: "fake_refund_payment-1" }, { reference: "fake_refund_payment-1" }]);
    expect(await database.fakeProviderOperation.count()).toBe(2);
  });

  it("rejects refund of missing or failed payment", async () => {
    await expect(provider.refund({ ...input, idempotencyKey: "refund", providerPaymentId: "missing" })).rejects.toMatchObject({ status: 409 });
    const payment = await provider.settle(input, "FAILED");
    await expect(provider.refund({ ...input, idempotencyKey: "refund", providerPaymentId: payment.reference })).rejects.toMatchObject({ status: 409 });
  });

  it("concurrent settlement persists one provider receipt", async () => {
    const results = await Promise.all([provider.settle(input, "SUCCEEDED"), provider.settle(input, "SUCCEEDED")]);
    expect(results[0]).toEqual(results[1]);
    expect(await database.fakeProviderOperation.count()).toBe(1);
  });
});
