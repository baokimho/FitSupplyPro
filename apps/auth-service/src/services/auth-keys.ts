import { readFileSync } from "fs";
import path from "node:path";
import { calculateJwkThumbprint, importJWK, SignJWT, jwtVerify, type CryptoKey, type JWK } from "jose";
import { publicVerificationJwk, readAuthPolicy, ServiceUnavailableError, UnauthorizedError, validKeyId } from "@shared/utils";
import type { AuthServiceConfig } from "../config/env.js";

type KeySet = { activeKid: string; privateKey: CryptoKey; publicKeys: JWK[]; verification: Map<string, CryptoKey> };

/** Auth-only private material. Atomic file replacement is the runtime rotation API. */
export function createAuthKeyStore(config: AuthServiceConfig) {
  const policy = config.authPolicy ?? readAuthPolicy();
  let cached: KeySet | undefined;
  let nextRead = -Infinity;
  let pending: Promise<KeySet> | undefined;
  let failed = false;

  async function load(): Promise<KeySet> {
    let privateJwk: JWK;
    let publicKeys: JWK[];
    let activeKid: string;
    if (config.jwtKeyringFile) {
      const ring = JSON.parse(readFileSync(config.jwtKeyringFile, "utf8")) as { activeKid: unknown; privateKey: JWK; keys: unknown[] };
      if (!validKeyId(ring.activeKid) || !Array.isArray(ring.keys) || ring.keys.length < 1 || ring.keys.length > 8) throw new Error();
      activeKid = ring.activeKid;
      privateJwk = ring.privateKey;
      publicKeys = ring.keys.map(publicVerificationJwk);
    } else {
      const read = (encoded: string | undefined, name: string) => JSON.parse(encoded
        ? Buffer.from(encoded, "base64").toString("utf8") : readFileSync(path.resolve(process.cwd(), `keys/${name}.json`), "utf8")) as JWK;
      privateJwk = read(config.jwtPrivateKeyBase64, "private");
      const publicJwk = read(config.jwtPublicKeyBase64, "public");
      activeKid = publicJwk.kid ?? privateJwk.kid ?? await calculateJwkThumbprint(publicJwk);
      publicKeys = [publicVerificationJwk({ alg: "RS256", use: "sig", ...publicJwk, kid: activeKid })];
    }
    const active = publicKeys.find((key) => key.kid === activeKid);
    if (!active || !privateJwk || privateJwk.kty !== "RSA" || typeof privateJwk.d !== "string" ||
      (privateJwk.alg !== undefined && privateJwk.alg !== "RS256") || (privateJwk.use !== undefined && privateJwk.use !== "sig") ||
      (privateJwk.kid !== undefined && privateJwk.kid !== activeKid) || privateJwk.n !== active.n || privateJwk.e !== active.e) throw new Error();
    const verification = new Map<string, CryptoKey>();
    for (const key of publicKeys) {
      if (verification.has(key.kid!)) throw new Error();
      const previous = cached?.publicKeys.find((old) => old.kid === key.kid);
      if (previous && (previous.n !== key.n || previous.e !== key.e)) throw new Error();
      verification.set(key.kid!, await importJWK(key, "RS256") as CryptoKey);
    }
    const privateKey = await importJWK(privateJwk, "RS256") as CryptoKey;
    // Import alone need not prove a valid matching signing pair.
    const proof = await new SignJWT({}).setProtectedHeader({ alg: "RS256" }).sign(privateKey);
    await jwtVerify(proof, verification.get(activeKid)! , { algorithms: ["RS256"] });
    return { activeKid, privateKey, publicKeys, verification };
  }

  return async function getKeys(): Promise<KeySet> {
    if (pending) return pending;
    if (Date.now() < nextRead) {
      if (failed || !cached) throw new ServiceUnavailableError("Signing keys unavailable");
      return cached;
    }
    nextRead = Date.now() + policy.keyReloadMs;
    pending = load().then((keys) => { cached = keys; failed = false; return keys; })
      .catch(() => { failed = true; throw new ServiceUnavailableError("Signing keys unavailable"); })
      .finally(() => { pending = undefined; });
    return pending;
  };
}

export async function selectVerificationKey(keys: KeySet, header?: { kid?: string; alg?: string }) {
  const kid = header === undefined ? keys.activeKid : header.kid;
  if (!validKeyId(kid) || (header && header.alg !== "RS256")) throw new UnauthorizedError("Invalid token");
  const key = keys.verification.get(kid);
  if (!key) throw new UnauthorizedError("Invalid token");
  return key;
}
