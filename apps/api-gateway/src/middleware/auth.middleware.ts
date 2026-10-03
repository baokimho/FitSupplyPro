import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { wrapAsync, verifyAuthToken, createPublicKeyLoader } from "@shared/utils";
import type { AuthSessionUser } from "@shared/utils";

import { config } from "../config/index.js";

const getPublicKey = createPublicKeyLoader(config.jwksAuthServiceUrl, config.gatewaySecret);

export type GatewayUser = AuthSessionUser;


export const authMiddleware = wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
	const authorization = req.headers.authorization;
	const authHeader = Array.isArray(authorization) ? authorization[0] : authorization;
	const token = authHeader?.split(" ")[1];

	if (!token) {
		return res.status(StatusCodes.UNAUTHORIZED).json({ error: { code: "UNAUTHORIZED", message: "Missing token" } });
	}

	const payload = await verifyAuthToken(token, await getPublicKey(), "access");

	if (
		typeof payload.sub !== "string" ||
		typeof payload.email !== "string" ||
		typeof payload.name !== "string" ||
		typeof payload.role !== "string"
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
