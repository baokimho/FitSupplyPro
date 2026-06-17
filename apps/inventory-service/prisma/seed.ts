import "dotenv/config";

import prisma from "../src/config/db.js";

const inventories = [
  {
    productId: "prod_whey_a",
    stock: 100,
    reservedStock: 0,
    lowStockThreshold: 10,
  },
  {
    productId: "prod_creatine_b",
    stock: 50,
    reservedStock: 5,
    lowStockThreshold: 10,
  },
  {
    productId: "prod_preworkout_c",
    stock: 20,
    reservedStock: 0,
    lowStockThreshold: 5,
  },
];

async function main() {
  await prisma.inventory.deleteMany();

  for (const inventory of inventories) {
    await prisma.inventory.create({
      data: inventory,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Inventory seed completed");
  })
  .catch(async (error) => {
    console.error("Inventory seed failed:", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
