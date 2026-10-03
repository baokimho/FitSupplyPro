import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { exportJWK, generateKeyPair, type JWK } from "jose";
import { createPublicKeyLoader } from "./jwt.js";

let publicKey: JWK;
beforeAll(async () => {
  publicKey = await exportJWK((await generateKeyPair("RS256", { extractable: true })).publicKey);
});
afterEach(() => vi.unstubAllGlobals());

describe("configured JWKS loader", () => {
  it("uses injected URL/secret and shares concurrent/cached key loads", async () => {
    const fetch = vi.fn(async () => Response.json({ keys: [publicKey] }));
    vi.stubGlobal("fetch", fetch);
    const getKey = createPublicKeyLoader("https://auth.test/base", "configured-secret");
    const [first, second] = await Promise.all([getKey(), getKey()]);
    expect(first).toBe(second);
    expect(await getKey()).toBe(first);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(new URL("https://auth.test/jwks"), {
      headers: { "x-internal-secret": "configured-secret" },
    });
  });

  it("retries failed loads without coupling separate loader caches", async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockImplementation(async () => Response.json({ keys: [publicKey] }));
    vi.stubGlobal("fetch", fetch);
    const getKey = createPublicKeyLoader("https://auth.test", "secret");
    await expect(getKey()).rejects.toThrow("Unable to load public key from auth service: 503");
    await getKey();
    await createPublicKeyLoader("https://other.test", "other-secret")();
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
