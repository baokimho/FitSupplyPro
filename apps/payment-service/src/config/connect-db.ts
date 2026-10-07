import prisma from "./db.js";
import { logger } from "../logger.js";

export async function connectDb() {
  await prisma.$connect();
  logger.info({ operation: "database-connect" }, "database connected");
}
