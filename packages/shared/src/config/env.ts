export type NodeEnv = "development" | "test" | "production";

type ConfigurationReason = "is required" | "must not be blank" | "must be an integer port from 1 to 65535" | "must be a complete HTTP(S) URL" | "must be development, test, or production";

/** Internal startup error. Reasons are fixed rules, never environment values. */
export class ConfigurationError extends Error {
  constructor(public readonly variable: string, public readonly reason: ConfigurationReason) {
    super(`Configuration variable ${variable} ${reason}`);
    this.name = "ConfigurationError";
  }
}

/** Validate without trimming returned content (including secrets and key material). */
export function requireEnvString(name: string, value: string | undefined): string {
  if (value === undefined) throw new ConfigurationError(name, "is required");
  if (value.trim() === "") throw new ConfigurationError(name, "must not be blank");
  return value;
}

/** Only undefined is absent; explicitly blank values fail. */
export function optionalEnvString(name: string, value: string | undefined): string | undefined {
  return value === undefined ? undefined : requireEnvString(name, value);
}

/** Defaults apply only to undefined and undergo the same range validation. */
export function parsePort(name: string, value: string | undefined, defaultValue?: number): number {
  const port = value === undefined && defaultValue !== undefined
    ? defaultValue
    : Number(requireEnvString(name, value));
  if ((value !== undefined && !/^\d+$/.test(value)) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigurationError(name, "must be an integer port from 1 to 65535");
  }
  return port;
}

/** Service URLs only. Return original content; reject syntax URL would silently repair. */
export function parseUrl(name: string, value: string | undefined): string {
  const url = requireEnvString(name, value);
  try {
    const parsed = new URL(url);
    if (!/^https?:\/\/[^/\\\s?#]/i.test(url) || /[\s\\]/.test(url) || !parsed.hostname ||
      (parsed.protocol !== "http:" && parsed.protocol !== "https:")) {
      throw new Error();
    }
  } catch {
    throw new ConfigurationError(name, "must be a complete HTTP(S) URL");
  }
  return url;
}

/** Defaults apply only to undefined; unknown or blank environments fail. */
export function parseNodeEnv(name: string, value: string | undefined, defaultValue?: NodeEnv): NodeEnv {
  const environment = requireEnvString(name, value === undefined ? defaultValue : value);
  if (environment !== "development" && environment !== "test" && environment !== "production") {
    throw new ConfigurationError(name, "must be development, test, or production");
  }
  return environment;
}
