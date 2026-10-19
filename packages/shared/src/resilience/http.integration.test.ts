import { createServer } from "node:http";
import { afterEach, expect, it } from "vitest";
import { createLogger } from "../logging/logger.js";
import { fetchDependency } from "./timeout.js";
import { retryOperation } from "./retry.js";

const logger = createLogger({ service: "resilience-network-test", environment: "test", level: "silent" });
const servers: ReturnType<typeof createServer>[] = [];
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

it("real stalled response is aborted; safe retry succeeds with bounded attempts and same context headers", async () => {
  let attempts = 0;
  const traces: Array<string | undefined> = [];
  let disconnected = false;
  const server = createServer((req, res) => {
    attempts++;
    traces.push(req.headers["x-trace-id"] as string | undefined);
    if (attempts === 1) {
      res.writeHead(200); res.write("{");
      res.on("close", () => { disconnected = true; });
    } else res.end('{"ok":true}');
  });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing test address");
  const result = await retryOperation(() => fetchDependency(`http://127.0.0.1:${address.port}`, { headers: { "x-trace-id": "same-trace" } }, {
    dependency: "catalog", operation: "GET", safe: true, timeoutMs: 200, logger,
  }), { dependency: "catalog", operation: "GET", safe: true, maxAttempts: 3, baseDelayMs: 1, maxDelayMs: 1, logger });
  expect(JSON.parse(result.text)).toEqual({ ok: true });
  expect(attempts).toBe(2);
  expect(traces).toEqual(["same-trace", "same-trace"]);
  expect(disconnected).toBe(true);
});
