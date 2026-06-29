import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createProxyMiddleware } from "http-proxy-middleware";
import { attachUserHeaders } from "./userHeaders.proxy.js";

const inventoryUrl = process.env.INVENTORY_SERVICE_URL || "http://localhost:3004";
const proxyTimeoutMs = 5000;

export const inventoryProxy = createProxyMiddleware<Request, Response>({
  target: inventoryUrl,
  changeOrigin: true,
  timeout: proxyTimeoutMs,
  proxyTimeout: proxyTimeoutMs,
  on: {
    proxyReq: attachUserHeaders,
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
