import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { exportJWK, generateKeyPair } from "jose";

const mocks = vi.hoisted(() => ({
  config: { jwtPrivateKeyBase64: undefined as string | undefined, jwtPublicKeyBase64: undefined as string | undefined },
  readFileSync: vi.fn(),
}));
vi.mock("../config/index.js", () => ({ config: mocks.config }));
vi.mock("fs", () => ({ readFileSync: mocks.readFileSync }));

let privateJson: string;
let publicJson: string;
beforeAll(async () => {
  const keys = await generateKeyPair("RS256", { extractable: true });
  privateJson = JSON.stringify(await exportJWK(keys.privateKey));
  publicJson = JSON.stringify(await exportJWK(keys.publicKey));
});
beforeEach(() => {
  vi.resetModules();
  mocks.readFileSync.mockReset();
  mocks.config.jwtPrivateKeyBase64 = Buffer.from(privateJson).toString("base64");
  mocks.config.jwtPublicKeyBase64 = Buffer.from(publicJson).toString("base64");
});
afterEach(() => {
  mocks.config.jwtPrivateKeyBase64 = undefined;
  mocks.config.jwtPublicKeyBase64 = undefined;
});

describe("auth startup key validation", () => {
  it("loads matching mounted Docker test fixtures and verifies signed tokens", async () => {
    const { readFileSync } = await vi.importActual<typeof import("node:fs")>("node:fs");
    mocks.config.jwtPrivateKeyBase64 = undefined;
    mocks.config.jwtPublicKeyBase64 = undefined;
    const fixture = (name: string) => readFileSync(new URL(`../../../../tests/fixtures/auth-keys/${name}.json`, import.meta.url), "utf8");
    mocks.readFileSync.mockImplementation((file: string) => fixture(file.endsWith("private.json") ? "private" : "public"));
    const { initializeAuthKeys, createAuthToken, getPublicKey } = await import("./auth.service.js");
    const { verifyAuthToken } = await import("@shared/utils");
    await initializeAuthKeys();
    const now = new Date();
    const token = await createAuthToken({ id: "fixture-user", email: "fixture@fitsupply.test", name: "Test", role: "CUSTOMER", passwordHash: "unused", createdAt: now, updatedAt: now });
    await expect(verifyAuthToken(token, await getPublicKey(), "access")).resolves.toMatchObject({ sub: "fixture-user", role: "CUSTOMER" });
  });

  it("imports configured RSA keys before startup", async () => {
    const { initializeAuthKeys } = await import("./auth.service.js");
    await expect(initializeAuthKeys()).resolves.toBeUndefined();
    expect(mocks.readFileSync).not.toHaveBeenCalled();
  });

  it("preserves file fallback when key variables are absent", async () => {
    mocks.config.jwtPrivateKeyBase64 = undefined;
    mocks.config.jwtPublicKeyBase64 = undefined;
    mocks.readFileSync.mockReturnValueOnce(privateJson).mockReturnValueOnce(publicJson);
    const { initializeAuthKeys } = await import("./auth.service.js");
    await expect(initializeAuthKeys()).resolves.toBeUndefined();
    expect(mocks.readFileSync.mock.calls.map(([file]) => String(file).replace(/\\/g, "/"))).toEqual([
      expect.stringMatching(/keys\/private.json$/), expect.stringMatching(/keys\/public.json$/),
    ]);
  });

  it.each(["jwtPrivateKeyBase64", "jwtPublicKeyBase64"] as const)("rejects malformed %s before startup", async (field) => {
    mocks.config[field] = "not-json";
    const { initializeAuthKeys } = await import("./auth.service.js");
    const { ServiceUnavailableError } = await import("@shared/utils");
    await expect(initializeAuthKeys()).rejects.toBeInstanceOf(ServiceUnavailableError);
  });

  it("fails startup when required key source is missing", async () => {
    mocks.config.jwtPrivateKeyBase64 = undefined;
    mocks.readFileSync.mockImplementation(() => { throw new Error("ENOENT"); });
    const { initializeAuthKeys } = await import("./auth.service.js");
    await expect(initializeAuthKeys()).rejects.toThrow("JWT_PRIVATE_KEY_BASE64 or keys/private.json is required");
  });
});
