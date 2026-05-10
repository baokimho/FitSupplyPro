import prisma from "./db";

export async function connectDb(): Promise<void> {
  await prisma.$connect();
  console.log("Auth DB connected successfully");
}