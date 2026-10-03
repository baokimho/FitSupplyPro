import { config } from "../config/index.js";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createProxyMiddleware } from "http-proxy-middleware";
import { attachUserHeaders } from "./userHeaders.proxy.js";

const authUrl = config.authServiceUrl;
const proxyTimeoutMs = 5000;

export const authProxy = createProxyMiddleware<Request, Response>({
  target: authUrl,
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
        error: { code: "SERVICE_UNAVAILABLE", message: "Service unavailable" },
      });
    },
  },
});
