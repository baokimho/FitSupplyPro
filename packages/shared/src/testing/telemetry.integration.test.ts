import { createServer, type Server } from "node:http";
import { once } from "node:events";
import express from "express";
import request from "supertest";
import { beforeAll, afterAll, expect, it } from "vitest";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { initializeTelemetry, telemetryHttp, traced, SpanKind, flushTelemetry, shutdownTelemetry } from "../observability/telemetry.js";

let collector: Server;
const bodies: string[] = [];
const app = express();
beforeAll(async () => {
  collector = createServer((req, res) => {
    let body = "";
    req.setEncoding("utf8"); req.on("data", (chunk: string) => { body += chunk; });
    req.on("end", () => { bodies.push(body); res.setHeader("content-type", "application/json"); res.end("{}"); });
  });
  collector.listen(0, "127.0.0.1"); await once(collector, "listening");
  const address = collector.address(); if (!address || typeof address === "string") throw new Error("No collector address");
  initializeTelemetry("payment-service", new OTLPTraceExporter({ url: `http://127.0.0.1:${address.port}/v1/traces`, timeoutMillis: 50 }));
  app.use(telemetryHttp("payment-service"));
  app.get("/work", (_req, res) => res.json({ ok: true }));
});
afterAll(async () => { if (collector.listening) await closeCollector(); await shutdownTelemetry(100); });

it("exports actual OTLP JSON with sanitized failure events", async () => {
  await request(app).get("/work").set("authorization", "Bearer NEVER-EXPORT").expect(200);
  await expect(traced("payment test", SpanKind.INTERNAL, {}, async () => { throw new Error("password=NEVER-EXPORT"); })).rejects.toThrow();
  await flushTelemetry();
  expect(bodies.length).toBeGreaterThan(0);
  const body = bodies.join("\n");
  expect(JSON.parse(bodies[0])).toHaveProperty("resourceSpans");
  expect(body).toContain("payment-service"); expect(body).toContain("payment test");
  expect(body).toContain("exception.type"); expect(body).not.toContain("NEVER-EXPORT");
});

it("real collector outage cannot block HTTP work and export failure stays isolated", async () => {
  await closeCollector();
  await request(app).get("/work").expect(200, { ok: true });
  await expect(flushTelemetry()).rejects.toBeDefined();
  await request(app).get("/work").expect(200, { ok: true });
});

async function closeCollector() { await new Promise<void>((resolve) => collector.close(() => resolve())); }
