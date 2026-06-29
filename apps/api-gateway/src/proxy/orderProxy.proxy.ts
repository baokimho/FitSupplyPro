import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createProxyMiddleware } from "http-proxy-middleware";
import { attachUserHeaders } from "./userHeaders.proxy.js";

const orderUrl = process.env.ORDER_SERVICE_URL || "http://localhost:3003";
const proxyTimeoutMs = 5000;

export const orderProxy = createProxyMiddleware<Request, Response>({
  target: orderUrl,
  changeOrigin: true,
  timeout: proxyTimeoutMs,
  proxyTimeout: proxyTimeoutMs,
  on: {
    proxyReq: (proxyReq, req) => {
      console.info("Order proxy forwarding request", {
        method: req.method,
        originalUrl: req.originalUrl,
        proxiedPath: req.url,
        targetUrl: `${orderUrl}${req.url}`,
      });

      attachUserHeaders(proxyReq, req);
    },
    error: (_err, _req, res) => {
      const response = res as Response;

      if (response.headersSent) {
        return;
      }
      response.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        message: "Service unavailable",
      });
    },
  },
});
