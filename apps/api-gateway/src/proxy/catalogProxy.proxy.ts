import type { Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const catalogUrl = process.env.CATALOG_SERVICE_URL || "http://localhost:3002";

export const catalogProxy = createProxyMiddleware<Request, Response>({
  target: catalogUrl,
  changeOrigin: true,
  pathRewrite: {
    "^/catalog": "",
  },
});
