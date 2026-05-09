import type { Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const orderUrl = process.env.ORDER_SERVICE_URL || "http://localhost:3003";

export const orderProxy = createProxyMiddleware<Request, Response>({
  target: orderUrl,
  changeOrigin: true,
  pathRewrite: {
    "^/order": "",
  },
});
