import { parseArgs } from "node:util";
import { createLogger, inspectDlq, openRabbitMq, readRabbitMqConfig, replayDlq } from "../packages/shared/dist/index.js";

const controller = new globalThis.AbortController();
const stop = () => controller.abort(new globalThis.DOMException("Operator shutdown", "AbortError"));
process.once("SIGINT", stop);
process.once("SIGTERM", stop);
const logger = createLogger({ service: "dlq-operator", environment: "production", level: "warn" }, process.stderr);
let broker;
try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    queue: { type: "string" }, id: { type: "string" }, confirm: { type: "string" }, limit: { type: "string" },
  } });
  const command = positionals[0];
  if (positionals.length !== 1 || !["inspect", "replay"].includes(command) || !values.queue) {
    throw new Error("Usage: npm run dlq -- inspect --queue <DLQ> [--limit 10] | replay --queue <DLQ> --id <ID> --confirm <ID> [--limit 100]");
  }
  // No env-file loading: explicit RABBITMQ_URL selects intended broker.
  broker = await openRabbitMq(readRabbitMqConfig(), logger);
  const limit = values.limit === undefined ? undefined : Number(values.limit);
  const result = command === "inspect" ? await inspectDlq(broker, values.queue, limit) :
    await replayDlq(broker, values.queue, values.id ?? "", values.confirm ?? "", limit, controller.signal);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch {
  // Never print arbitrary broker URL, stack, body or error text.
  process.stderr.write("DLQ command failed. Check command arguments, queue, replay eligibility and broker access; no unconfirmed delivery is ACKed.\n");
  process.exitCode = 1;
} finally {
  if (broker) {
    try { await broker.close(); }
    catch { process.stderr.write("DLQ connection close failed; inspect source/DLQ before retry.\n"); process.exitCode = 1; }
  }
  process.off("SIGINT", stop);
  process.off("SIGTERM", stop);
}
