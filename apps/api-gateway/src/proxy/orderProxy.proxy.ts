import { logger } from "../logger.js";
import { logPath } from "@shared/utils";
import { config } from "../config/index.js";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createProxyMiddleware } from "http-proxy-middleware";
import { attachUserHeaders, restoreRequestId } from "./userHeaders.proxy.js";

const orderUrl = config.orderServiceUrl;
const proxyTimeoutMs = 5000;

export const orderProxy = createProxyMiddleware<Request, Response>({
  target: orderUrl,
  changeOrigin: true,
  timeout: proxyTimeoutMs,
  proxyTimeout: proxyTimeoutMs,
  on: {
    proxyReq: attachUserHeaders,
    proxyRes: restoreRequestId,
    error: (err, req, res) => {
      logger.error({ ...req.correlation, err, targetService: "order-service", operation: "proxy", method: req.method, path: logPath(req.originalUrl ?? ""), statusCode: 503 }, "proxy request failed");
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
