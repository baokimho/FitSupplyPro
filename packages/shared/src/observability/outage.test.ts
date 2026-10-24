import express from "express";
import request from "supertest";
import { expect, it } from "vitest";
import type { SpanExporter } from "@opentelemetry/sdk-trace-node";
import { initializeTelemetry, telemetryHttp, shutdownTelemetry, registerTelemetryCollector } from "./telemetry.js";

const broken: SpanExporter = { export: (_spans, callback) => callback({ code: 1 }), shutdown: () => new Promise<void>(() => {}) };
initializeTelemetry("inventory-service", broken);
const app = express(); app.use(telemetryHttp("inventory-service"));
app.get("/work", (_req, res) => res.json({ ok: true }));

it("exporter outage and stalled metrics collection do not gate business requests", async () => {
  registerTelemetryCollector("broken", () => new Promise<void>(() => {}));
  await request(app).get("/work").expect(200, { ok: true });
  await request(app).get("/work").expect(200, { ok: true });
});

it("telemetry shutdown is bounded and idempotent even when exporter never closes", async () => {
  const started = performance.now();
  const first = shutdownTelemetry(20);
  expect(shutdownTelemetry(20)).toBe(first);
  await first;
  expect(performance.now() - started).toBeLessThan(500);
});
