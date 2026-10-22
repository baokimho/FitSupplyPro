import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { wrapAsync, verifyAuthToken, createPublicKeyLoader } from "@shared/utils";
import type { AuthSessionUser } from "@shared/utils";

import { config } from "../config/index.js";

const getPublicKey = createPublicKeyLoader(config.jwksAuthServiceUrl, config.gatewaySecret, config.authPolicy);

export type GatewayUser = AuthSessionUser;


export const authMiddleware = wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
	const authorization = req.headers.authorization;
	const authHeader = Array.isArray(authorization) ? authorization[0] : authorization;
	const token = authHeader?.match(/^Bearer ([^\s]+)$/i)?.[1];

	if (!token) {
		return res.status(StatusCodes.UNAUTHORIZED).json({ error: { code: "UNAUTHORIZED", message: "Missing token" } });
	}

	const payload = await verifyAuthToken(token, getPublicKey, "access", config.authPolicy);

	if (
		typeof payload.sub !== "string" ||
		(payload.role !== "CUSTOMER" && payload.role !== "ADMIN")
	) {
		return res.status(StatusCodes.UNAUTHORIZED).json({ error: { code: "UNAUTHORIZED", message: "Invalid token" } });
	}

	const user: AuthSessionUser = {
		id: payload.sub,
		role: payload.role,
	};

	req.user = user;

	return next();
});
