import { logger } from "../logger.js";
import prisma from "./db.js";

export async function connectDb(): Promise<void> {
  await prisma.$connect();
  logger.info("database connected");
}
