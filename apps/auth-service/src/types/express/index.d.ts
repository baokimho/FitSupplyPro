import type { AuthSessionUser } from "@shared/utils";

declare global {
  namespace Express {
    interface Request {
      user?: AuthSessionUser;
    }
  }
}

export {};