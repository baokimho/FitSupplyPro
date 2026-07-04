import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createProxyMiddleware } from "http-proxy-middleware";
import { attachUserHeaders } from "./userHeaders.proxy.js";

const shippingUrl = process.env.SHIPPING_SERVICE_URL || "http://localhost:3007";
const proxyTimeoutMs = 5000;

export const shippingProxy = createProxyMiddleware<Request, Response>({
  target: shippingUrl,
  changeOrigin: true,
  timeout: proxyTimeoutMs,
  proxyTimeout: proxyTimeoutMs,
  on: {
    proxyReq: (proxyReq, req) => {
      console.info("Shipping proxy forwarding request", {
        method: req.method,
        originalUrl: req.originalUrl,
        proxiedPath: req.url,
        targetUrl: `${shippingUrl}${req.url}`,
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
