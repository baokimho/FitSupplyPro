import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("test-matrix.mjs", import.meta.url));
const root = fileURLToPath(new URL("..", import.meta.url));
const list = (args, cwd = root) => spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8", timeout: 5000 });

test("discovery separates infrastructure tests and finds pure helpers in fast phase", () => {
  const result = list(["unit", "--workspace", "@shared/utils", "--list"]);
  assert.equal(result.status, 0, result.stderr);
  const [workspace] = JSON.parse(result.stdout);
  assert(workspace.unit.some((file) => file.endsWith("testing/infrastructure.test.ts")));
  assert(workspace.unit.some((file) => file.endsWith("testing/factories-cleanup.test.ts")));
  assert(workspace.integration.some((file) => file.endsWith("rabbitmq.integration.test.ts")));
  assert(workspace.unit.every((file) => !file.includes(".integration.")));
});
test("workspace discovery is identical from root and workspace working directories", () => {
  const args = ["integration", "--workspace", "catalog-service", "--list"];
  const fromRoot = list(args);
  const fromWorkspace = list(args, fileURLToPath(new URL("../apps/catalog-service", import.meta.url)));
  assert.equal(fromRoot.status, 0, fromRoot.stderr);
  assert.equal(fromWorkspace.status, 0, fromWorkspace.stderr);
  assert.deepEqual(JSON.parse(fromRoot.stdout), JSON.parse(fromWorkspace.stdout));
});
test("all eight persistence owners have integration suites", () => {
  const result = list(["all", "--list"]);
  assert.equal(result.status, 0, result.stderr);
  const workspaces = JSON.parse(result.stdout);
  const services = workspaces.filter((row) => row.workspace.endsWith("-service"));
  assert.equal(services.length, 8);
  for (const workspace of services) assert(workspace.integration.length > 0, workspace.workspace);
});
for (const args of [["integration", "--workspace", "missing"], ["unit", "--workspace"], ["unit", "--workspace="], ["unit", "--seed", "NaN"], ["typo"], ["unit", "--unexpected"]]) {
  test(`invalid selection fails before build or disposable infrastructure: ${args.join(" ")}`, () => {
    const result = list(args);
    assert.equal(result.status, 1);
    assert.doesNotMatch(result.stdout, /docker|db reset|\$ npm/);
  });
}
