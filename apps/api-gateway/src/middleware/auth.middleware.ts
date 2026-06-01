import type { NextFunction, Request, Response } from "express";
import { wrapAsync, verifyAuthToken, getPublicKey } from "@shared/utils";
import type { AuthSessionUser } from "@shared/utils";


export const authMiddleware = wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
	const authorization = req.headers.authorization;
	const authHeader = Array.isArray(authorization) ? authorization[0] : authorization;
	const token = authHeader?.split(" ")[1];

	if (!token) {
		return res.status(401).json({ message: "Missing token" });
	}

	const payload = await verifyAuthToken(token, await getPublicKey(), "access");

	if (
		typeof payload.sub !== "string" ||
		typeof payload.email !== "string" ||
		typeof payload.name !== "string" ||
		typeof payload.role !== "string"
	) {
		return res.status(401).json({ message: "Invalid token" });
	}

	const user: AuthSessionUser = {
		id: payload.sub,
		role: payload.role,
	};

	req.user = user;
	req.headers["x-user"] = JSON.stringify(user);

	return next();
});