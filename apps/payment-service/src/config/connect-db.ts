import prisma from "./db.js";

export async function connectDb() {
  await prisma.$connect();
  console.log("Payment database connected");
}
