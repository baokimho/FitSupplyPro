import { config } from "../config/index.js";
import type { ClientRequest } from "http";
import type { Request, Response } from "express";
import type { IncomingMessage } from "http";
import { correlationHeaders } from "@shared/utils";
const proxyStartedAt = new WeakMap<Request, number>();

export function proxyFailureContext(req: Request) {
  const started = proxyStartedAt.get(req);
  return { timeoutMs: config.proxyTimeoutMs, elapsedMs: started === undefined ? undefined : Math.round(performance.now() - started),
    failureClass: req.method === "GET" || req.method === "HEAD" ? "transient" : "ambiguous" };
}

export function restoreRequestId(proxyRes: IncomingMessage, req: Request, res?: Response) {
  const hopHeaders = ["connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade",
    ...(proxyRes.headers.connection ?? "").split(",").map((name) => name.trim().toLowerCase())];
  for (const name of Object.keys(proxyRes.headers)) {
    if (hopHeaders.includes(name) || name.startsWith("access-control-") || res?.hasHeader(name)) delete proxyRes.headers[name];
  }
  if (req.correlation) proxyRes.headers["x-request-id"] = req.correlation.requestId;
}

const clientHeaders = new Set(["accept", "accept-language", "content-type", "user-agent", "if-none-match", "if-match",
  "if-modified-since", "if-unmodified-since", "idempotency-key", "authorization"]);

type GatewayRequest = Request & {
  user?: {
    id: string;
    role: string;
  };
};

export function attachUserHeaders(proxyReq: ClientRequest, req: Request) {
  proxyStartedAt.set(req, performance.now());
  const gatewayRequest = req as GatewayRequest;
  const internalSecret = config.gatewaySecret;
  const nominated = new Set((req.headers?.connection ?? "").split(",").map((name) => name.trim().toLowerCase()));
  for (const name of proxyReq.getHeaderNames()) {
    if (name !== "host" && (!clientHeaders.has(name) || nominated.has(name))) proxyReq.removeHeader(name);
  }
  for (const [name, value] of Object.entries(correlationHeaders(req.correlation))) {
    proxyReq.setHeader(name, value);
  }

  if (internalSecret) {
    proxyReq.setHeader("x-internal-secret", internalSecret);
  }

  if (gatewayRequest.user) {
    proxyReq.setHeader("x-user-id", gatewayRequest.user.id);
    proxyReq.setHeader("x-user-role", gatewayRequest.user.role);
    // Authenticated downstream requests consume verified identity, not client tokens.
    proxyReq.removeHeader("authorization");
  }
  if (Buffer.isBuffer(req.body)) {
    proxyReq.setHeader("content-length", req.body.length);
    if (req.body.length) proxyReq.write(req.body);
  }
}
