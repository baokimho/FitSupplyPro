import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const phase = process.argv[2] ?? "unit";
const filterIndex = process.argv.indexOf("--workspace");
const workspaceFilter = filterIndex === -1 ? undefined : process.argv[filterIndex + 1];
const workspaceDirs = [
  "apps/api-gateway",
  "apps/auth-service",
  "apps/catalog-service",
  "apps/inventory-service",
  "apps/order-service",
  "apps/cart-service",
  "apps/payment-service",
  "apps/shipping-service",
  "apps/notification-service",
  "packages/shared",
];

const testEnv = {
  API_GATEWAY_URL: "http://localhost:3500",
  AUTH_DATABASE_URL: "postgresql://fitsupply_test:fitsupply_test@localhost:55433/auth_test_db",
  CATALOG_DATABASE_URL: "postgresql://fitsupply_test:fitsupply_test@localhost:55433/catalog_test_db",
  INVENTORY_DATABASE_URL: "postgresql://fitsupply_test:fitsupply_test@localhost:55433/inventory_test_db",
  ORDER_DATABASE_URL: "postgresql://fitsupply_test:fitsupply_test@localhost:55433/order_test_db",
  CART_DATABASE_URL: "postgresql://fitsupply_test:fitsupply_test@localhost:55433/cart_test_db",
  PAYMENT_DATABASE_URL: "postgresql://fitsupply_test:fitsupply_test@localhost:55433/payment_test_db",
  SHIPPING_DATABASE_URL: "postgresql://fitsupply_test:fitsupply_test@localhost:55433/shipping_test_db",
  NOTIFICATION_DATABASE_URL: "postgresql://fitsupply_test:fitsupply_test@localhost:55433/notification_test_db",
  GATEWAY_SECRET: "fitsupply_test_internal_secret",
};

function readPackageJson(dir) {
  const file = path.join(root, dir, "package.json");
  return JSON.parse(existsSync(file) ? readFileSync(file, "utf8") : "{}");
}

function walk(dir, results = []) {
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (entry === "node_modules" || entry === "dist" || entry === "generated" || entry === "coverage") continue;
    const stats = statSync(full);
    if (stats.isDirectory()) walk(full, results);
    else results.push(full);
  }
  return results;
}

function testsFor(dir, kind) {
  const files = walk(path.join(root, dir, "src"));
  return files.filter((file) => {
    const normalized = file.replace(/\\/g, "/");
    const isTest = /\.(test|spec)\.tsx?$/.test(normalized);
    if (!isTest) return false;
    const isIntegration = normalized.includes(".integration.test.") || normalized.includes(".integration.spec.");
    return kind === "integration" ? isIntegration : !isIntegration;
  });
}

function hasProductionSource(dir) {
  return walk(path.join(root, dir, "src")).some((file) => {
    const normalized = file.replace(/\\/g, "/");
    return normalized.endsWith(".ts") &&
      !normalized.includes("/generated/") &&
      !normalized.includes(".test.") &&
      !normalized.includes(".spec.") &&
      !normalized.includes("/testing/");
  });
}

function selectedWorkspaceDirs() {
  const dirs = workspaceDirs.filter((dir) => existsSync(path.join(root, dir, "package.json")));
  if (!workspaceFilter) return dirs;
  const selected = dirs.filter((dir) => {
    const pkg = readPackageJson(dir);
    return pkg.name === workspaceFilter || dir === workspaceFilter || path.basename(dir) === workspaceFilter;
  });
  if (selected.length === 0) {
    console.error(`[matrix] workspace not found: ${workspaceFilter}`);
    process.exit(1);
  }
  return selected;
}

function run(command, args, options = {}) {
  console.log(`\n$ ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    env: { ...process.env, ...(options.env ?? {}) },
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return result.status ?? 1;
}

function runWorkspaceTests(kind, options = {}) {
  let failed = 0;
  const summary = [];

  for (const dir of selectedWorkspaceDirs()) {
    const pkg = readPackageJson(dir);
    const files = testsFor(dir, kind);
    const prod = hasProductionSource(dir);

    if (files.length === 0) {
      summary.push({ workspace: pkg.name, status: prod ? "gap: no tests" : "skip: no production source", count: 0 });
      continue;
    }

    console.log(`\n[${kind}] ${pkg.name}: ${files.length} file(s)`);
    const status = run("npm", [
      "exec", "--workspace", pkg.name, "--", "vitest", "run",
      ...files.map((file) => path.relative(path.join(root, dir), file)),
    ], { env: options.env });
    if (status !== 0) failed = status;
    summary.push({ workspace: pkg.name, status: status === 0 ? "passed" : `failed (${status})`, count: files.length });
    if (status !== 0) break;
  }

  console.log(`\n${kind} matrix summary:`);
  for (const row of summary) console.log(`- ${row.workspace}: ${row.status}; files=${row.count}`);
  return failed;
}

function runCommandOrRememberFailure(label, command, args, currentFailure) {
  const status = run(command, args);
  if (status !== 0) {
    console.error(`[${label}] failed with exit code ${status}`);
    return currentFailure || status;
  }
  return currentFailure;
}

function stopTestDb(currentFailure) {
  const downStatus = run("npm", ["run", "test:db:down"]);
  if (downStatus !== 0) console.error(`[db teardown] failed with exit code ${downStatus}`);
  return currentFailure || downStatus;
}

function runIntegrationWorkflow() {
  let failure = 0;

  const onSignal = (signal) => {
    console.error(`[integration] received ${signal}; tearing down disposable resources`);
    stopTestDb(0);
    process.exit(130);
  };
  process.once("SIGINT", () => onSignal("SIGINT"));
  process.once("SIGTERM", () => onSignal("SIGTERM"));

  try {
    failure = runCommandOrRememberFailure("db compose config", "npm", ["run", "test:db:config"], failure);
    if (failure === 0) failure = runCommandOrRememberFailure("db reset/readiness", "npm", ["run", "test:db:reset"], failure);
    if (failure === 0) failure = runCommandOrRememberFailure("db prepare", "npm", ["run", "test:db:prepare"], failure);
    if (failure === 0) failure = runWorkspaceTests("integration", { env: testEnv });
  } finally {
    failure = stopTestDb(failure);
  }

  return failure;
}

function runAll() {
  console.log("\n[all] unit phase");
  const unitStatus = runWorkspaceTests("unit");
  if (unitStatus !== 0) {
    console.error("[all] unit phase failed");
    return unitStatus;
  }
  console.log("\n[all] integration phase");
  const integrationStatus = runIntegrationWorkflow();
  if (integrationStatus !== 0) console.error("[all] integration phase failed");
  return integrationStatus;
}

function coverageArgs(dir) {
  const out = path.join(root, "coverage", dir.replace(/[\\/]/g, "-"));
  const files = testsFor(dir, "unit").concat(testsFor(dir, "integration"));
  return [
    "exec", "--workspace", readPackageJson(dir).name, "--", "vitest", "run",
    ...files.map((file) => path.relative(path.join(root, dir), file)),
    "--coverage.enabled", "--coverage.provider=v8",
    "--coverage.reporter=text", "--coverage.reporter=json", "--coverage.reporter=json-summary",
    "--coverage.reporter=html", "--coverage.reporter=lcov",
    "--coverage.reportsDirectory", out,
    "--coverage.all=true",
    "--coverage.include=src/**/*.ts",
    "--coverage.exclude=src/generated/**",
    "--coverage.exclude=src/testing/**",
    "--coverage.exclude=**/*.test.ts",
    "--coverage.exclude=**/*.spec.ts",
    "--coverage.exclude=dist/**",
    "--coverage.exclude=prisma/**",
  ];
}

function runCoverage() {
  mkdirSync(path.join(root, "coverage"), { recursive: true });
  const reports = [];
  let failed = 0;

  try {
    failed = runCommandOrRememberFailure("coverage db compose config", "npm", ["run", "test:db:config"], failed);
    if (failed === 0) failed = runCommandOrRememberFailure("coverage db reset/readiness", "npm", ["run", "test:db:reset"], failed);
    if (failed === 0) failed = runCommandOrRememberFailure("coverage db prepare", "npm", ["run", "test:db:prepare"], failed);

    if (failed === 0) {
      for (const dir of selectedWorkspaceDirs()) {
        const allTests = testsFor(dir, "unit").concat(testsFor(dir, "integration"));
        if (allTests.length === 0) continue;
        const status = run("npm", coverageArgs(dir), { env: testEnv });
        if (status !== 0) {
          failed = status;
          break;
        }
        reports.push({ workspace: readPackageJson(dir).name, directory: `coverage/${dir.replace(/[\\/]/g, "-")}` });
      }
    }
  } finally {
    failed = stopTestDb(failed);
  }

  writeFileSync(path.join(root, "coverage", "summary.json"), JSON.stringify({ aggregate: false, reports }, null, 2));
  console.log("\nCoverage reports are per-workspace, not aggregated:");
  for (const report of reports) console.log(`- ${report.workspace}: ${report.directory}`);
  return failed;
}

let status;
if (phase === "unit") status = runWorkspaceTests("unit");
else if (phase === "integration") status = runIntegrationWorkflow();
else if (phase === "all") status = runAll();
else if (phase === "coverage") status = runCoverage();
else {
  console.error(`Unknown test matrix phase: ${phase}`);
  status = 1;
}
process.exit(status);
