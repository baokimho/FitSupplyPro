import crypto from "node:crypto";
import { spawnSync } from "node:child_process";

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
  runOrThrow("stack teardown", "docker", [...compose, "down", "-v", "--remove-orphans"]);
  runOrThrow("stack startup", "docker", [...compose, "up", "-d", "--build", "--wait", "--wait-timeout", "180"]);
  seedAdmin();
  failure = run("npm", ["exec", "--", "vitest", "run", "tests/e2e/purchase-lifecycle.e2e.test.ts"], {
    env: {
      API_GATEWAY_URL: "http://localhost:3500",
      E2E_ADMIN_EMAIL: adminEmail,
      E2E_ADMIN_PASSWORD: adminPassword,
    },
  });
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

