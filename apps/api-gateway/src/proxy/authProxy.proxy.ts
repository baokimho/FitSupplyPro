import type { Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";

export const proxyMiddleware = createProxyMiddleware<Request, Response>({
  target: authUrl,
  changeOrigin: true,
  pathRewrite: {
    "^/auth": "",
  },
});