import "dotenv/config";

import prisma from "../src/config/db.js";

const categories = [
  {
    name: "Supplements",
    slug: "supplements",
    description: "Protein, vitamins, creatine, and daily nutrition",
  },
  {
    name: "Equipment",
    slug: "equipment",
    description: "Training gear and fitness equipment",
  },
  {
    name: "Apparel",
    slug: "apparel",
    description: "Workout clothing and accessories",
  },
];

const products = [
  {
    name: "Whey Protein 2kg",
    slug: "whey-protein-2kg",
    sku: "SUP-WHEY-2KG",
    description: "High-protein whey blend for post-workout recovery.",
    price: 79.9,
    images: [
      "https://picsum.photos/seed/whey-protein-2kg/800/800",
    ],
    isPublished: true,
    categorySlug: "supplements",
  },
  {
    name: "Creatine Monohydrate 500g",
    slug: "creatine-monohydrate-500g",
    sku: "SUP-CREA-500G",
    description: "Micronized creatine monohydrate for strength and power.",
    price: 34.9,
    images: [
      "https://picsum.photos/seed/creatine-monohydrate-500g/800/800",
    ],
    isPublished: true,
    categorySlug: "supplements",
  },
  {
    name: "Adjustable Dumbbell Set",
    slug: "adjustable-dumbbell-set",
    sku: "EQ-DB-SET",
    description: "Space-saving adjustable dumbbells for home training.",
    price: 249.0,
    images: [
      "https://picsum.photos/seed/adjustable-dumbbell-set/800/800",
    ],
    isPublished: true,
    categorySlug: "equipment",
  },
  {
    name: "Training T-Shirt",
    slug: "training-t-shirt",
    sku: "AP-TSHIRT-001",
    description: "Breathable training tee for everyday workouts.",
    price: 24.9,
    images: [
      "https://picsum.photos/seed/training-t-shirt/800/800",
    ],
    isPublished: false,
    categorySlug: "apparel",
  },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
      },
      create: category,
    });
  }

  for (const product of products) {
    const category = await prisma.category.findUnique({
      where: { slug: product.categorySlug },
      select: { id: true },
    });

    if (!category) {
      throw new Error(`Missing category for product seed: ${product.categorySlug}`);
    }

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        sku: product.sku,
        description: product.description,
        price: product.price,
        images: product.images,
        isPublished: product.isPublished,
        categoryId: category.id,
      },
      create: {
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        description: product.description,
        price: product.price,
        images: product.images,
        isPublished: product.isPublished,
        categoryId: category.id,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Catalog seed completed");
  })
  .catch(async (error) => {
    console.error("Catalog seed failed:", error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
