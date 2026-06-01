import type { GatewayUser } from "../../middleware/auth.middleware.js";

declare global {
  namespace Express {
    interface Request {
      user?: GatewayUser;
    }
  }
}

export {};