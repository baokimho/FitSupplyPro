import { createProxyMiddleware } from "http-proxy-middleware";
import type { Request, RequestHandler, Response } from "express";
import { logPath } from "@shared/utils";
import { config } from "../config/index.js";
import { logger } from "../logger.js";
import { attachUserHeaders, proxyFailureContext, restoreRequestId } from "./userHeaders.proxy.js";

/** All configured service routes share one edge transport policy. No retries. */
export function serviceProxy(target: string, targetService: string): RequestHandler {
  const proxy = createProxyMiddleware<Request, Response>({
    target,
    changeOrigin: true,
    proxyTimeout: config.proxyTimeoutMs,
    on: {
      proxyReq: (proxyReq, req, res) => {
        attachUserHeaders(proxyReq, req);
        const deadline = setTimeout(() => {
          fail("ETIMEDOUT", req, res);
          proxyReq.destroy();
        }, config.proxyTimeoutMs);
        const stop = () => { clearTimeout(deadline); if (!proxyReq.destroyed) proxyReq.destroy(); };
        res.once("finish", stop);
        res.once("close", stop);
      },
      proxyRes: restoreRequestId,
      error: (err, req, res) => fail("code" in err && typeof err.code === "string" ? err.code : "PROXY_ERROR", req, res as Response),
    },
  });

  return (req, res, next) => {
    // http-proxy skips proxyReq hooks when Expect exists. Node already handled
    // client 100-continue; never let this hop header bypass sanitization/deadlines.
    delete req.headers.expect;
    return proxy(req, res, next);
  };

  function fail(code: string, req: Request, res: Response) {
    if (res.destroyed || res.writableEnded) return;
    const timeout = code === "ETIMEDOUT" || code === "ESOCKETTIMEDOUT";
    const unavailable = ["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"].includes(code);
    const statusCode = timeout ? 504 : unavailable ? 503 : 502;
    logger.error({ ...req.correlation, targetService, operation: "proxy", method: req.method,
      path: logPath(req.originalUrl ?? ""), statusCode, transportCode: timeout ? "TIMEOUT" : unavailable ? "UNAVAILABLE" : "BAD_RESPONSE",
      ...proxyFailureContext(req) }, "proxy request failed");
    if (res.headersSent) { res.destroy(); return; }
    res.status(statusCode).json({ error: {
      code: timeout ? "GATEWAY_TIMEOUT" : unavailable ? "SERVICE_UNAVAILABLE" : "BAD_GATEWAY",
      message: timeout ? "Gateway timeout" : unavailable ? "Service unavailable" : "Bad gateway",
    } });
  }
}
