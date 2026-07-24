import { spawnSync } from "node:child_process";

const testUser = "fitsupply_test";
const testPassword = "fitsupply_test";
const host = process.env.TEST_DATABASE_HOST ?? "localhost";
const port = process.env.TEST_DATABASE_PORT ?? "55433";
const shadowDatabase = "fitsupply_test";

const services = [
  ["auth-service", "auth_test_db"],
  ["catalog-service", "catalog_test_db"],
  ["inventory-service", "inventory_test_db"],
  ["order-service", "order_test_db"],
  ["cart-service", "cart_test_db"],
  ["payment-service", "payment_test_db"],
  ["shipping-service", "shipping_test_db"],
  ["notification-service", "notification_test_db"],
];

function databaseUrl(databaseName) {
  return `postgresql://${testUser}:${testPassword}@${host}:${port}/${databaseName}`;
}

function assertSafe(databaseName, url) {
  const parsed = new URL(url);
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    throw new Error(`${databaseName}: expected PostgreSQL URL`);
  }
  if (parsed.username !== testUser) {
    throw new Error(`${databaseName}: expected ${testUser} user`);
  }
  const actualDatabase = parsed.pathname.replace(/^\//, "");
  if (actualDatabase !== databaseName) {
    throw new Error(`${databaseName}: URL targets ${actualDatabase}`);
  }
  if (databaseName !== shadowDatabase && !databaseName.endsWith("_test_db")) {
    throw new Error(`${databaseName}: test database name must end with _test_db`);
  }
}

function run(serviceName, args, env) {
  const result = spawnSync("npm", ["exec", "--workspace", serviceName, "--", "prisma", ...args], {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    throw new Error(`${serviceName}: prisma ${args.join(" ")} failed`);
  }
}

for (const [serviceName, dbName] of services) {
  const url = databaseUrl(dbName);
  const shadowUrl = databaseUrl(shadowDatabase);
  assertSafe(dbName, url);
  assertSafe(shadowDatabase, shadowUrl);

  const env = {
    DATABASE_URL: url,
    SHADOW_DATABASE_URL: shadowUrl,
  };

  console.log(`\n[${serviceName}] checking migration drift for ${dbName}`);
  run(serviceName, ["migrate", "diff", "--from-migrations", "prisma/migrations", "--to-schema", "prisma/schema.prisma", "--exit-code"], env);

  console.log(`[${serviceName}] applying migrations to ${dbName}`);
  run(serviceName, ["migrate", "deploy", "--config", "prisma.config.ts", "--schema", "prisma/schema.prisma"], env);
}

console.log("\nAll test databases prepared. No global seed data required for Task 6.");