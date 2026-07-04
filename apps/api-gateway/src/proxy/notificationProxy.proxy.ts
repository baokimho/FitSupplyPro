import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createProxyMiddleware } from "http-proxy-middleware";
import { attachUserHeaders } from "./userHeaders.proxy.js";

const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3008";
const proxyTimeoutMs = 5000;

export const notificationProxy = createProxyMiddleware<Request, Response>({
  target: notificationUrl,
  changeOrigin: true,
  timeout: proxyTimeoutMs,
  proxyTimeout: proxyTimeoutMs,
  on: {
    proxyReq: (proxyReq, req) => {
      console.info("Notification proxy forwarding request", {
        method: req.method,
        originalUrl: req.originalUrl,
        proxiedPath: req.url,
        targetUrl: `${notificationUrl}${req.url}`,
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
