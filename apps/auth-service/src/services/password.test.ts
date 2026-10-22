import { scryptSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { comparePassword, hashPassword } from "./password.js";
import { loginSchema, registerSchema } from "../validations/auth.schema.js";

describe("credential security", () => {
  it("salts current-cost hashes independently and compares without plaintext persistence", async () => {
    const password = "a practical passphrase";
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).toMatch(/^scrypt:131072:8:1:[a-f0-9]{32}:[a-f0-9]{128}$/);
    expect(first).not.toBe(second); expect(first).not.toContain(password);
    expect(await comparePassword(password, first)).toBe(true);
    expect(await comparePassword("wrong password", first)).toBe(false);
    expect(await comparePassword(password, undefined)).toBe(false);
    expect(await comparePassword(password, "malformed:hash")).toBe(false);
  });
  it("verifies existing scrypt hashes without truncating passwords", async () => {
    const salt = "12345678901234567890123456789012";
    const legacy = `${salt}:${scryptSync("legacy-password", salt, 64).toString("hex")}`;
    expect(await comparePassword("legacy-password", legacy)).toBe(true);
    expect(await comparePassword("legacy-password-extra", legacy)).toBe(false);
  });
  it.each(["", "short", " ".repeat(12), "x".repeat(129)])("rejects invalid registration password", (password) => {
    expect(registerSchema.safeParse({ name: "Person", email: "person@test.invalid", password }).success).toBe(false);
  });
  it("normalizes only email casing/outer whitespace, strips requested roles and preserves password", () => {
    const input = registerSchema.parse({ name: " Person ", email: " Person+Tag@Test.invalid ", password: "  correct horse battery  ", role: "ADMIN" });
    expect(input).toEqual({ name: "Person", email: "person+tag@test.invalid", password: "  correct horse battery  " });
    expect(loginSchema.parse({ email: " Person@Test.invalid ", password: "old123" }).password).toBe("old123");
  });
});
