export type TestDatabaseName =
  | "auth_test_db"
  | "catalog_test_db"
  | "inventory_test_db"
  | "order_test_db"
  | "cart_test_db"
  | "payment_test_db"
  | "shipping_test_db"
  | "notification_test_db";

export type ServiceName =
  | "api-gateway"
  | "auth-service"
  | "catalog-service"
  | "inventory-service"
  | "order-service"
  | "cart-service"
  | "payment-service"
  | "shipping-service"
  | "notification-service";

export interface IntegrationTestEnv {
  databaseUrls: Partial<Record<TestDatabaseName, string>>;
  serviceBaseUrls: Partial<Record<ServiceName, string>>;
  gatewaySecret: string;
}

export interface WaitForHttpOptions {
  url: string;
  timeoutMs?: number;
  intervalMs?: number;
  headers?: Record<string, string>;
  fetchImpl?: typeof fetch;
}

const expectedTestDatabases: readonly TestDatabaseName[] = [
  "auth_test_db",
  "catalog_test_db",
  "inventory_test_db",
  "order_test_db",
  "cart_test_db",
  "payment_test_db",
  "shipping_test_db",
  "notification_test_db",
];

const serviceEnvVars: Record<ServiceName, string> = {
  "api-gateway": "API_GATEWAY_URL",
  "auth-service": "AUTH_SERVICE_URL",
  "catalog-service": "CATALOG_SERVICE_URL",
  "inventory-service": "INVENTORY_SERVICE_URL",
  "order-service": "ORDER_SERVICE_URL",
  "cart-service": "CART_SERVICE_URL",
  "payment-service": "PAYMENT_SERVICE_URL",
  "shipping-service": "SHIPPING_SERVICE_URL",
  "notification-service": "NOTIFICATION_SERVICE_URL",
};

const databaseEnvVars: Record<TestDatabaseName, string> = {
  auth_test_db: "AUTH_DATABASE_URL",
  catalog_test_db: "CATALOG_DATABASE_URL",
  inventory_test_db: "INVENTORY_DATABASE_URL",
  order_test_db: "ORDER_DATABASE_URL",
  cart_test_db: "CART_DATABASE_URL",
  payment_test_db: "PAYMENT_DATABASE_URL",
  shipping_test_db: "SHIPPING_DATABASE_URL",
  notification_test_db: "NOTIFICATION_DATABASE_URL",
};

export function requireEnv(name: string, env: NodeJS.ProcessEnv = process.env): string {
  const value = env[name];
  if (!value) {
    throw new Error(`${name} is required for integration tests`);
  }
  return value;
}

export function assertSafeTestDatabaseUrl(
  databaseName: TestDatabaseName,
  databaseUrl: string,
): string {
  let parsed: URL;

  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error(`${databaseName} DATABASE_URL is not a valid URL`);
  }

  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error(`${databaseName} DATABASE_URL must use PostgreSQL`);
  }

  const actualDatabase = parsed.pathname.replace(/^\//, "");
  if (actualDatabase !== databaseName) {
    throw new Error(`${databaseName} DATABASE_URL must target ${databaseName}`);
  }

  if (!actualDatabase.endsWith("_test_db")) {
    throw new Error(`${databaseName} DATABASE_URL must target a *_test_db database`);
  }

  if (parsed.username !== "fitsupply_test") {
    throw new Error(`${databaseName} DATABASE_URL must use the test database user`);
  }

  return databaseUrl;
}

export function readIntegrationTestEnv(env: NodeJS.ProcessEnv = process.env): IntegrationTestEnv {
  const databaseUrls: Partial<Record<TestDatabaseName, string>> = {};
  for (const databaseName of expectedTestDatabases) {
    const value = env[databaseEnvVars[databaseName]];
    if (value) {
      databaseUrls[databaseName] = assertSafeTestDatabaseUrl(databaseName, value);
    }
  }

  const serviceBaseUrls: Partial<Record<ServiceName, string>> = {};
  for (const [serviceName, envName] of Object.entries(serviceEnvVars) as Array<[ServiceName, string]>) {
    const value = env[envName];
    if (value) {
      serviceBaseUrls[serviceName] = value.replace(/\/$/, "");
    }
  }

  return {
    databaseUrls,
    serviceBaseUrls,
    gatewaySecret: env.GATEWAY_SECRET ?? "fitsupply_test_internal_secret",
  };
}

export function requireTestDatabaseUrl(
  databaseName: TestDatabaseName,
  env: NodeJS.ProcessEnv = process.env,
): string {
  return assertSafeTestDatabaseUrl(databaseName, requireEnv(databaseEnvVars[databaseName], env));
}

export function getServiceBaseUrl(
  serviceName: ServiceName,
  env: NodeJS.ProcessEnv = process.env,
): string {
  const envName = serviceEnvVars[serviceName];
  const value = env[envName];
  if (!value) {
    throw new Error(`${envName} is required for ${serviceName} integration tests`);
  }
  return value.replace(/\/$/, "");
}

export async function waitForHttpOk(options: WaitForHttpOptions): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const intervalMs = options.intervalMs ?? 250;
  const fetchImpl = options.fetchImpl ?? fetch;
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;

  while (Date.now() <= deadline) {
    try {
      const response = await fetchImpl(options.url, { headers: options.headers });
      if (response.ok) {
        return;
      }
      lastError = new Error(`${options.url} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Timed out waiting for ${options.url}: ${String(lastError)}`);
}

export async function usingTestResource<T>(
  setup: () => Promise<T>,
  cleanup: (resource: T) => Promise<void>,
  run: (resource: T) => Promise<void>,
): Promise<void> {
  const resource = await setup();
  try {
    await run(resource);
  } finally {
    await cleanup(resource);
  }
}