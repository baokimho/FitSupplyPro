import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { exportJWK, generateKeyPair, SignJWT, type CryptoKey } from "jose";
import { PrismaPg } from "@prisma/adapter-pg";
import { BadRequestError, errorHandler, ServiceUnavailableError } from "@shared/utils";
import { Prisma, PrismaClient } from "../generated/prisma/index.js";
import { saveRefreshToken } from "./auth.service.js";
import express from "express";
import request from "supertest";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: "postgresql://fitsupply_test:unused@localhost/auth_test_db" }) });
let privateKey: CryptoKey;

async function makeToken(type = "refresh", expires = true) {
  const token = new SignJWT({ sub: "test-user", type })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer("fitsupply-auth-service")
    .setAudience("fitsupply-api");
  if (expires) token.setExpirationTime("5m");
  return token.sign(privateKey);
}

describe("refresh-token error translation", () => {
  beforeAll(async () => {
    const keys = await generateKeyPair("RS256", { extractable: true });
    privateKey = keys.privateKey;
    vi.stubEnv("JWT_PUBLIC_KEY_BASE64", Buffer.from(JSON.stringify(await exportJWK(keys.publicKey))).toString("base64"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    await prisma.$disconnect();
  });

  it.each(["malformed", "wrong-type", "missing-exp"])("preserves invalid refresh-token 400 behavior: %s", async (kind) => {
    const create = vi.spyOn(prisma.refreshToken, "create");
    const token = kind === "malformed" ? "private-malformed-token" : await makeToken(kind === "wrong-type" ? "access" : "refresh", kind !== "missing-exp");
    const error = await saveRefreshToken(prisma, "test-user", token).catch((error: unknown) => error);
    expect(error).toBeInstanceOf(BadRequestError);
    expect(error).toMatchObject({ status: 400, code: "BAD_REQUEST", message: "Invalid refresh token", cause: expect.any(Error) });
    expect(create).not.toHaveBeenCalled();
  });

  it("preserves key-loading infrastructure errors instead of returning 400", async () => {
    const token = await makeToken();
    const priorKey = process.env.JWT_PUBLIC_KEY_BASE64;
    vi.stubEnv("JWT_PUBLIC_KEY_BASE64", "not-json");
    try {
      const error = await saveRefreshToken(prisma, "test-user", token).catch((error: unknown) => error);
      expect(error).toBeInstanceOf(ServiceUnavailableError);
      expect(error).toMatchObject({ status: 503, code: "SERVICE_UNAVAILABLE" });
    } finally {
      vi.stubEnv("JWT_PUBLIC_KEY_BASE64", priorKey);
    }
  });

  it.each([
    new Prisma.PrismaClientKnownRequestError("private DB failure", { code: "P1001", clientVersion: "7.8.0" }),
    new Error("private unexpected persistence failure"),
  ])("preserves original persistence rejection", async (error) => {
    vi.spyOn(prisma.refreshToken, "create").mockRejectedValue(error);
    await expect(saveRefreshToken(prisma, "test-user", await makeToken())).rejects.toBe(error);
  });

  it("routes persistence connectivity failures through shared 503 envelope", async () => {
    const error = new Prisma.PrismaClientKnownRequestError("private DB credentials", { code: "P1001", clientVersion: "7.8.0" });
    vi.spyOn(prisma.refreshToken, "create").mockRejectedValue(error);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const token = await makeToken();
    const app = express();
    app.post("/", async (_req, res) => res.json(await saveRefreshToken(prisma, "test-user", token)));
    app.use(errorHandler);
    const response = await request(app).post("/");
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ message: "Database unavailable", error: { code: "SERVICE_UNAVAILABLE", message: "Database unavailable" } });
    expect(console.error).toHaveBeenCalledWith("Error handled:", error);
  });

  it("keeps valid refresh-token persistence unchanged", async () => {
    const now = new Date();
    const create = vi.spyOn(prisma.refreshToken, "create").mockResolvedValue({
      id: "test-token-id", userId: "test-user", tokenHash: "test-hash", expiresAt: now,
      createdAt: now, revokedAt: null, replacedByTokenId: null,
    });
    await expect(saveRefreshToken(prisma, "test-user", await makeToken())).resolves.toMatchObject({ id: "test-token-id" });
    expect(create).toHaveBeenCalledWith({ data: { userId: "test-user", tokenHash: expect.any(String), expiresAt: expect.any(Date) } });
  });
});
