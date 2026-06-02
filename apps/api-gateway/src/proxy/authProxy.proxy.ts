import type { Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { attachUserHeaders } from "./userHeaders.proxy.js";

const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:3001";
const proxyTimeoutMs = 5000;

export const authProxy = createProxyMiddleware<Request, Response>({
  target: authUrl,
  changeOrigin: true,
  timeout: proxyTimeoutMs,
  proxyTimeout: proxyTimeoutMs,
  pathRewrite: {
    "^/auth": "",
  },
  on: {
    proxyReq: attachUserHeaders,
    error: (_err, _req, res) => {
      const response = res as Response;

      if (response.headersSent) {
        return;
      }
      response.status(503).json({
        message: "Service unavailable",
      });
    },
  },
});