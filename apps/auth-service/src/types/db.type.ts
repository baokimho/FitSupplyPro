import type { PrismaClient, Prisma } from "../generated/prisma/index.js"

export type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;