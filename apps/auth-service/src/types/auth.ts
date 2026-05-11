import type { PrismaClient, Prisma, Role } from "@prisma/client";
import type { JwtPayload } from "jsonwebtoken";

export type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

export type AuthTokenType = "access" | "refresh";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
};

export type AuthTokenPayload = JwtPayload & {
  sub: string;
  email: string;
  name: string;
  role: Role;
  type: AuthTokenType;
};