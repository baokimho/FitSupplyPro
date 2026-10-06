import { logger } from "../logger.js";
import { logPath } from "@shared/utils";
import { config } from "../config/index.js";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createProxyMiddleware } from "http-proxy-middleware";
import { attachUserHeaders } from "./userHeaders.proxy.js";

const inventoryUrl = config.inventoryServiceUrl;
const proxyTimeoutMs = 5000;

export const inventoryProxy = createProxyMiddleware<Request, Response>({
  target: inventoryUrl,
  changeOrigin: true,
  timeout: proxyTimeoutMs,
  proxyTimeout: proxyTimeoutMs,
  on: {
    proxyReq: attachUserHeaders,
    error: (err, req, res) => {
      logger.error({ err, targetService: "inventory-service", operation: "proxy", method: req.method, path: logPath(req.originalUrl ?? ""), statusCode: 503 }, "proxy request failed");
      const response = res as Response;

      if (response.headersSent) {
        return;
      }

      response.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        error: { code: "SERVICE_UNAVAILABLE", message: "Service unavailable" },
      });
    },
  },
});
