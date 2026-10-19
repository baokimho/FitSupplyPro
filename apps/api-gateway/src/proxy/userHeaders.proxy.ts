import { config } from "../config/index.js";
import type { ClientRequest } from "http";
import type { Request } from "express";
import type { IncomingMessage } from "http";
import { correlationHeaders } from "@shared/utils";
const proxyStartedAt = new WeakMap<Request, number>();

export function proxyFailureContext(req: Request) {
  const started = proxyStartedAt.get(req);
  return { timeoutMs: config.proxyTimeoutMs, elapsedMs: started === undefined ? undefined : Math.round(performance.now() - started),
    failureClass: req.method === "GET" || req.method === "HEAD" ? "transient" : "ambiguous" };
}

export function restoreRequestId(proxyRes: IncomingMessage, req: Request) {
  if (req.correlation) proxyRes.headers["x-request-id"] = req.correlation.requestId;
}

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

  proxyReq.removeHeader("x-user-id");
  proxyReq.removeHeader("x-user-role");
  proxyReq.removeHeader("x-internal-secret");
  proxyReq.removeHeader("x-request-id");
  proxyReq.removeHeader("x-trace-id");
  for (const [name, value] of Object.entries(correlationHeaders(req.correlation))) {
    proxyReq.setHeader(name, value);
  }

  if (internalSecret) {
    proxyReq.setHeader("x-internal-secret", internalSecret);
  }

  if (!gatewayRequest.user) {
    return;
  }

  proxyReq.setHeader("x-user-id", gatewayRequest.user.id);
  proxyReq.setHeader("x-user-role", gatewayRequest.user.role);
}
