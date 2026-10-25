import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

process.chdir(fileURLToPath(new URL("..", import.meta.url)));
const { values } = parseArgs({ options: { seed: { type: "string" } } });
if (values.seed !== undefined && !/^\d{1,9}$/.test(values.seed)) throw new Error("E2E seed must be an integer");

const compose = ["compose", "-p", "fitsupply-e2e", "-f", "docker-compose.test.yml"];
const adminEmail = "admin.e2e@fitsupply.test";
const adminPassword = "AdminE2E!12345";

function run(command, args, options = {}) {
  console.log(`\n$ ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...(options.env ?? {}) },
  });
  return result.status ?? 1;
}

function runOrThrow(label, command, args, options) {
  const status = run(command, args, options);
  if (status !== 0) {
    throw new Error(`${label} failed with exit code ${status}`);
  }
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function seedAdmin() {
  const passwordHash = hashPassword(adminPassword);
  const sql = `
    INSERT INTO "User" ("id", "email", "passwordHash", "name", "role", "updatedAt")
    VALUES ('e2e-admin-user', ${sqlString(adminEmail)}, ${sqlString(passwordHash)}, 'E2E Admin', 'ADMIN', NOW())
    ON CONFLICT ("email") DO UPDATE
    SET "passwordHash" = EXCLUDED."passwordHash",
        "name" = EXCLUDED."name",
        "role" = 'ADMIN',
        "updatedAt" = NOW();
  `;

  const args = [
    ...compose,
    "exec",
    "-T",
    "postgres-test",
    "psql",
    "-U",
    "fitsupply_test",
    "-d",
    "auth_test_db",
    "-v",
    "ON_ERROR_STOP=1",
    "-f",
    "-",
  ];
  console.log(`\n$ ${["docker", ...args].join(" ")}`);
  const result = spawnSync("docker", args, {
    input: sql,
    stdio: ["pipe", "inherit", "inherit"],
    shell: false,
  });
  const status = result.status ?? 1;
  if (status !== 0) {
    throw new Error(`admin seed failed with exit code ${status}`);
  }
}

let failure = 0;

try {
  runOrThrow("shared test build", "npm", ["run", "build", "--workspace", "@shared/utils"]);
  for (const mode of ["sync", "async-success", "async-failure"]) {
    const env = { EVENT_DRIVEN_CHECKOUT: mode === "sync" ? "false" : "true", TEST_CHECKOUT_PAYMENT_OUTCOME: mode === "async-failure" ? "FAILED" : "SUCCEEDED" };
    runOrThrow("stack teardown", "docker", [...compose, "down", "-v", "--remove-orphans"]);
    runOrThrow("stack startup", "docker", [...compose, "up", "-d", "--build", "--wait", "--wait-timeout", "180"], { env });
    seedAdmin();
    failure = run("npm", ["exec", "--", "vitest", "run", mode === "sync" ? "tests/e2e/purchase-lifecycle.e2e.test.ts" : "tests/e2e/event-checkout.e2e.test.ts",
      ...(values.seed ? ["--sequence.shuffle", "--sequence.seed", values.seed] : [])], {
      env: {
        ...env,
        RABBITMQ_URL: "amqp://fitsupply_test:fitsupply_test@localhost:5674",
        API_GATEWAY_URL: "http://localhost:3500",
        E2E_ADMIN_EMAIL: adminEmail,
        E2E_ADMIN_PASSWORD: adminPassword,
      },
    });
    if (failure) break;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  failure = 1;
} finally {
  const downStatus = run("docker", [...compose, "down", "-v", "--remove-orphans"]);
  if (downStatus !== 0 && failure === 0) {
    failure = downStatus;
  }
}

process.exit(failure);

