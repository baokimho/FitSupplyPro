import type { Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { attachUserHeaders } from "./userHeaders.proxy.js";

const catalogUrl = process.env.CATALOG_SERVICE_URL || "http://localhost:3002";
const proxyTimeoutMs = 5000;

export const catalogProxy = createProxyMiddleware<Request, Response>({
  target: catalogUrl,
  changeOrigin: true,
  timeout: proxyTimeoutMs,
  proxyTimeout: proxyTimeoutMs,
  pathRewrite: {
    "^/catalog": "",
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
