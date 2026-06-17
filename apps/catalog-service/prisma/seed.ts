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
  {
    name: "Recovery",
    slug: "recovery",
    description: "Mobility, recovery, and wellness essentials",
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Everyday gym accessories and training add-ons",
  },
];

const brands = [
  {
    name: "OptiFuel",
    slug: "optifuel",
    description: "Performance nutrition and recovery supplements",
    logoUrl: "https://picsum.photos/seed/optifuel-logo/256/256",
  },
  {
    name: "IronForge",
    slug: "ironforge",
    description: "Training equipment and strength gear",
    logoUrl: "https://picsum.photos/seed/ironforge-logo/256/256",
  },
  {
    name: "MoveLab",
    slug: "movelab",
    description: "Functional apparel for training and daily wear",
    logoUrl: "https://picsum.photos/seed/movelab-logo/256/256",
  },
  {
    name: "PulseForm",
    slug: "pulseform",
    description: "Recovery tools and mobility essentials",
    logoUrl: "https://picsum.photos/seed/pulseform-logo/256/256",
  },
  {
    name: "CoreKit",
    slug: "corekit",
    description: "Gym accessories for performance and convenience",
    logoUrl: "https://picsum.photos/seed/corekit-logo/256/256",
  },
];

const products = [
  {
    id: "prod_whey_a",
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
    brandSlug: "optifuel",
  },
  {
    id: "prod_creatine_b",
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
    brandSlug: "optifuel",
  },
  {
    id: "prod_preworkout_c",
    name: "Pre-Workout Citrus",
    slug: "pre-workout-citrus",
    sku: "SUP-PWO-CIT",
    description: "Energy and focus blend for intense training sessions.",
    price: 29.9,
    images: [
      "https://picsum.photos/seed/pre-workout-citrus/800/800",
    ],
    isPublished: true,
    categorySlug: "supplements",
    brandSlug: "optifuel",
  },
  {
    id: "prod_adjustable_dumbbell_set",
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
    brandSlug: "ironforge",
  },
  {
    id: "prod_resistance_band_set",
    name: "Resistance Band Set",
    slug: "resistance-band-set",
    sku: "EQ-BAND-SET",
    description: "Progressive resistance bands for warmups and accessory work.",
    price: 39.9,
    images: [
      "https://picsum.photos/seed/resistance-band-set/800/800",
    ],
    isPublished: true,
    categorySlug: "equipment",
    brandSlug: "ironforge",
  },
  {
    id: "prod_training_tshirt",
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
    brandSlug: "movelab",
  },
  {
    id: "prod_performance_hoodie",
    name: "Performance Hoodie",
    slug: "performance-hoodie",
    sku: "AP-HOODIE-001",
    description: "Soft fleece hoodie built for warmups and recovery days.",
    price: 59.9,
    images: [
      "https://picsum.photos/seed/performance-hoodie/800/800",
    ],
    isPublished: true,
    categorySlug: "apparel",
    brandSlug: "movelab",
  },
  {
    id: "prod_massage_gun_mini",
    name: "Massage Gun Mini",
    slug: "massage-gun-mini",
    sku: "RC-MG-MINI",
    description: "Compact percussive recovery tool for travel and home use.",
    price: 89.9,
    images: [
      "https://picsum.photos/seed/massage-gun-mini/800/800",
    ],
    isPublished: true,
    categorySlug: "recovery",
    brandSlug: "pulseform",
  },
  {
    id: "prod_foam_roller",
    name: "Foam Roller",
    slug: "foam-roller",
    sku: "RC-FOAM-001",
    description: "Textured foam roller for muscle release and mobility work.",
    price: 27.5,
    images: [
      "https://picsum.photos/seed/foam-roller/800/800",
    ],
    isPublished: true,
    categorySlug: "recovery",
    brandSlug: "pulseform",
  },
  {
    id: "prod_shaker_bottle",
    name: "Shaker Bottle",
    slug: "shaker-bottle",
    sku: "AC-SHAKER-001",
    description: "Leak-resistant shaker with measurement markers.",
    price: 14.9,
    images: [
      "https://picsum.photos/seed/shaker-bottle/800/800",
    ],
    isPublished: true,
    categorySlug: "accessories",
    brandSlug: "corekit",
  },
  {
    id: "prod_lifting_straps",
    name: "Lifting Straps",
    slug: "lifting-straps",
    sku: "AC-STRAPS-001",
    description: "Heavy-duty lifting straps for pulling movements.",
    price: 18.9,
    images: [
      "https://picsum.photos/seed/lifting-straps/800/800",
    ],
    isPublished: true,
    categorySlug: "accessories",
    brandSlug: "corekit",
  },
];

async function main() {
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();

  for (const category of categories) {
    await prisma.category.create({
      data: category,
    });
  }

  for (const brand of brands) {
    await prisma.brand.create({
      data: brand,
    });
  }

  for (const product of products) {
    const [category, brand] = await Promise.all([
      prisma.category.findUnique({
        where: { slug: product.categorySlug },
        select: { id: true },
      }),
      prisma.brand.findUnique({
        where: { slug: product.brandSlug },
        select: { id: true },
      }),
    ]);

    if (!category) {
      throw new Error(`Missing category for product seed: ${product.categorySlug}`);
    }

    if (!brand) {
      throw new Error(`Missing brand for product seed: ${product.brandSlug}`);
    }

    await prisma.product.create({
      data: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        description: product.description,
        price: product.price,
        images: product.images,
        isPublished: product.isPublished,
        categoryId: category.id,
        brandId: brand.id,
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
