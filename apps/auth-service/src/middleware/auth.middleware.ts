import { Request, Response, NextFunction } from "express";
import { UnauthorizedError, wrapAsync, verifyAuthToken, type AuthSessionUser } from "@shared/utils";
import { getPublicKey } from "../utils/auth.helpers.js";

export const authMiddleware = wrapAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token = (req.headers.authorization)?.split(' ')[1]
    
    if (!token) {
        throw new UnauthorizedError("Missing token")
    }

    const payload = await verifyAuthToken(token, await getPublicKey(), "access")

    if (!payload.sub || !payload.role) {
        throw new UnauthorizedError("Invalid token")
    }

    const user: AuthSessionUser = {
        id: payload.sub,
        role: payload.role
    }
    req.user = user
    next()
})