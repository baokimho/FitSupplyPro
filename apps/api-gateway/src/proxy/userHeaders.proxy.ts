import type { ClientRequest } from "http";
import type { Request } from "express";

type GatewayRequest = Request & {
  user?: {
    id: string;
    role: string;
  };
};

export function attachUserHeaders(proxyReq: ClientRequest, req: Request) {
  const gatewayRequest = req as GatewayRequest;
  const internalSecret = process.env.GATEWAY_SECRET;

  if (internalSecret) {
    proxyReq.setHeader("x-internal-secret", internalSecret);
  }

  if (!gatewayRequest.user) {
    return;
  }

  proxyReq.setHeader("x-user-id", gatewayRequest.user.id);
  proxyReq.setHeader("x-user-role", gatewayRequest.user.role);
} 