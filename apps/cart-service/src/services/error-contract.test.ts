import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchJson } from "./cart.service.js";

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
    await expect(fetchJson("http://downstream/resource")).rejects.toMatchObject({ status: 503, code: "SERVICE_UNAVAILABLE", message: "Downstream service unavailable", details: { url: "http://downstream/resource", status: 503 } });
  });

  it("preserves business message in successful response", async () => {
    const body = { message: "Product updated", data: { id: "product-1" } };
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body))));
    await expect(fetchJson("http://downstream/resource")).resolves.toEqual(body);
  });
});
