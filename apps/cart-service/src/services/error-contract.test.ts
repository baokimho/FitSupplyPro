import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchJson, getProductById } from "./cart.service.js";
import { randomUUID } from "node:crypto";
import { runWithCorrelation, traced, SpanKind, validCorrelationId } from "@shared/utils";

vi.mock("../config/db.js", () => ({ default: {} }));

describe("cart downstream error contract", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("reads nested message, domain code and details", async () => {
    const details = { quantity: 2 };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { code: "INSUFFICIENT_STOCK", message: "Not enough inventory", details } }), { status: 409 })));
    await expect(fetchJson("http://downstream/resource")).rejects.toMatchObject({ status: 400, code: "INSUFFICIENT_STOCK", message: "Not enough inventory", details });
  });

  it.each(["<html>private upstream failure</html>", "{", "null", '"private text"', '{"error":null}', '{"error":{"message":123,"code":false}}', '{"message":"legacy private message"}'])("uses safe fallback for malformed/absent envelope: %s", async (body) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status: 400 })));
    await expect(fetchJson("http://downstream/resource")).rejects.toMatchObject({ status: 400, code: "BAD_REQUEST", message: "Downstream request failed", details: undefined });
  });

  it("keeps missing-resource status and nested fields", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: { code: "PRODUCT_MISSING", message: "Product absent" } }), { status: 404 })));
    await expect(fetchJson("http://downstream/resource")).rejects.toMatchObject({ status: 404, code: "PRODUCT_MISSING", message: "Product absent" });
  });

  it("does not expose malformed server-error body", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("private SQL", { status: 503 })));
    await expect(fetchJson("http://downstream/resource")).rejects.toMatchObject({ status: 503, code: "SERVICE_UNAVAILABLE", message: "Downstream service unavailable", details: { status: 503 } });
  });

  it("preserves business message in successful response", async () => {
    const body = { message: "Product updated", data: { id: "product-1" } };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body))));
    await expect(fetchJson("http://downstream/resource")).resolves.toEqual(body);
  });

  it("retries safe Catalog reads with a bounded budget and no transport diagnostics in public details", async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error("password=private connection details")).mockResolvedValue(new Response('{"ok":true}'));
    vi.stubGlobal("fetch", fetch);
    expect(await fetchJson("http://downstream/resource")).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
    fetch.mockReset().mockRejectedValue(new Error("password=private"));
    try { await fetchJson("http://downstream/resource"); throw new Error("expected dependency failure"); }
    catch (error) { expect(error).toMatchObject({ status: 503, details: undefined }); }
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("never retries a mutation or permanent missing product", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("private", { status: 503 }));
    vi.stubGlobal("fetch", fetch);
    await expect(fetchJson("http://downstream/resource", { method: "POST" })).rejects.toMatchObject({ status: 503 });
    expect(fetch).toHaveBeenCalledTimes(1);
    fetch.mockClear().mockResolvedValue(new Response("{}", { status: 404 }));
    await expect(fetchJson("http://downstream/resource")).rejects.toMatchObject({ status: 404 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("Catalog calls carry UUID correlation and active W3C context", async () => {
    const requestId = randomUUID(); const traceId = randomUUID();
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      expect(headers.get("x-trace-id")).toBe(traceId);
      expect(validCorrelationId(headers.get("x-request-id"))).toBe(true);
      expect(headers.get("x-request-id")).not.toBe(requestId);
      expect(headers.get("traceparent")).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
      return new Response(JSON.stringify({ data: { id: "product", name: "Current", price: "10.00", isPublished: true } }));
    }));
    await runWithCorrelation({ requestId, traceId }, () => traced("cart test", SpanKind.INTERNAL, {}, () => getProductById("product")));
  });

  it("dependency cancellation propagates without retry", async () => {
    const controller = new AbortController();
    const fetch = vi.fn(async (_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("cancelled", "AbortError")), { once: true });
    }));
    vi.stubGlobal("fetch", fetch);
    const work = fetchJson("http://downstream/resource", { signal: controller.signal });
    controller.abort();
    await expect(work).rejects.toMatchObject({ name: "AbortError" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
