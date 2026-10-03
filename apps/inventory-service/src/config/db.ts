import { config } from "./index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/index.js";
import pg from "pg";

const connectionString = config.databaseUrl;

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (config.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
