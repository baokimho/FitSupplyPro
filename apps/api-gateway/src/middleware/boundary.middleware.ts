import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import { BadRequestError, HttpError } from "@shared/utils";
import { config } from "../config/index.js";

/** Normalize unreserved escapes before Express makes access-control decisions. */
export const validateRequestTarget: RequestHandler = (req, _res, next) => {
  try {
    const target = req.url;
    const path = target.split("?", 1)[0];
    const decoded = decodeURIComponent(path);
    decodeURIComponent(target.slice(path.length));
    const hasControl = (value: string) => [...value].some((char) => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127);
    if (!target.startsWith("/") || target.startsWith("//") || /[\\#]/.test(target) || hasControl(target) ||
      /%(?:2f|5c|3f|23|25)/i.test(path) || decoded.includes("//") ||
      decoded.split("/").some((segment) => segment === "." || segment === "..") || hasControl(decoded)) {
      throw new Error();
    }
    req.url = path.replace(/%([0-9a-f]{2})/gi, (escape, hex: string) => {
      const char = String.fromCharCode(parseInt(hex, 16));
      return /[a-z0-9_.~-]/i.test(char) ? char : escape;
    }) + target.slice(path.length);
    next();
  } catch {
    next(new BadRequestError("Invalid request target"));
  }
};

// Buffer once under a hard cap. Forward exact bytes; services keep domain parsing.
export const readRequestBody = express.raw({ type: () => true, limit: config.bodyLimitBytes, inflate: false });

export const validateJsonBody: RequestHandler = (req, _res, next) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) return next();
  if (!req.is(["application/json", "application/*+json"])) return next(new HttpError(415, "JSON content type required", undefined, "UNSUPPORTED_MEDIA_TYPE"));
  try {
    // Fatal decoding prevents silently replacing invalid UTF-8 inside JSON strings.
    JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(req.body));
    next();
  } catch {
    next(new BadRequestError("Malformed JSON"));
  }
};

export const parserErrorHandler: ErrorRequestHandler = (err: unknown, _req, _res, next) => {
  if (typeof err === "object" && err !== null && "type" in err) {
    switch (err.type) {
      case "entity.too.large": return next(new HttpError(413, "Payload too large", undefined, "PAYLOAD_TOO_LARGE"));
      case "encoding.unsupported": return next(new HttpError(415, "Unsupported content encoding", undefined, "UNSUPPORTED_MEDIA_TYPE"));
      case "request.aborted":
      case "request.size.invalid": return next(new BadRequestError("Invalid request body"));
    }
  }
  next(err);
};
