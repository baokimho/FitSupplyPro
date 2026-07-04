import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createProxyMiddleware } from "http-proxy-middleware";
import { attachUserHeaders } from "./userHeaders.proxy.js";

const paymentUrl = process.env.PAYMENT_SERVICE_URL || "http://localhost:3006";
const proxyTimeoutMs = 5000;

export const paymentProxy = createProxyMiddleware<Request, Response>({
  target: paymentUrl,
  changeOrigin: true,
  timeout: proxyTimeoutMs,
  proxyTimeout: proxyTimeoutMs,
  on: {
    proxyReq: (proxyReq, req) => {
      console.info("Payment proxy forwarding request", {
        method: req.method,
        originalUrl: req.originalUrl,
        proxiedPath: req.url,
        targetUrl: `${paymentUrl}${req.url}`,
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
