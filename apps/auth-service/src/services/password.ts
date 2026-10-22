import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const N = 131072;
const dummy = "scrypt:131072:8:1:00000000000000000000000000000000:6ca3a7d32cc971785e9b64d8138b9c93ac31cb27cce9ad4d905812e1b11bcb4fe73cc184c672f8da757bc8eeb0e69c5582773cf2dc4f8e65fe2f9bbe9abb34b8";
const derive = (password: string, salt: string, cost: number) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, 64, { N: cost, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }, (err, result) => err ? reject(err) : resolve(result));
});

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${N}:8:1:${salt}:${(await derive(password, salt, N)).toString("hex")}`;
}

/** Absent/malformed records still perform one current-cost password derivation. */
export async function comparePassword(password: string, passwordHash?: string) {
  const current = /^scrypt:131072:8:1:([a-f0-9]{32}):([a-f0-9]{128})$/.exec(passwordHash ?? "");
  const legacy = /^([a-f0-9]{32}):([a-f0-9]{128})$/.exec(passwordHash ?? "");
  const match = current ?? legacy ?? /^scrypt:131072:8:1:([a-f0-9]{32}):([a-f0-9]{128})$/.exec(dummy)!;
  const derived = await derive(password, match[1], legacy ? 16384 : N);
  return timingSafeEqual(Buffer.from(match[2], "hex"), derived) && (current !== null || legacy !== null);
}
