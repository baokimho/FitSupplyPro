import prisma from "./db.js";

export async function connectDb(): Promise<void> {
  await prisma.$connect();
  console.log("Cart DB connected successfully");
}
