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

  proxyReq.removeHeader("x-user-id");
  proxyReq.removeHeader("x-user-role");
  proxyReq.removeHeader("x-internal-secret");

  if (internalSecret) {
    proxyReq.setHeader("x-internal-secret", internalSecret);
  }

  if (!gatewayRequest.user) {
    return;
  }

  proxyReq.setHeader("x-user-id", gatewayRequest.user.id);
  proxyReq.setHeader("x-user-role", gatewayRequest.user.role);
} 