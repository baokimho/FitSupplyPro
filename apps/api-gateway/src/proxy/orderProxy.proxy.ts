import type { Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { attachUserHeaders } from "./userHeaders.proxy.js";

const orderUrl = process.env.ORDER_SERVICE_URL || "http://localhost:3003";
const proxyTimeoutMs = 5000;

export const orderProxy = createProxyMiddleware<Request, Response>({
  target: orderUrl,
  changeOrigin: true,
  timeout: proxyTimeoutMs,
  proxyTimeout: proxyTimeoutMs,
  pathRewrite: {
    "^/order": "",
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
