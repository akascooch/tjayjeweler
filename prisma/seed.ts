import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(connectionString),
});

const bootstrapPassword = "Abcd123456A";

const categories = [
  {
    name: "Rings / انگشترها",
    slug: "rings",
    description: "Rings / انگشترها",
  },
  {
    name: "Pendants & Chains / آویز و زنجیر",
    slug: "pendants-chains",
    description: "Pendants & Chains / آویز و زنجیر",
  },
  {
    name: "Cuffs & Bracelets / دستبند",
    slug: "cuffs-bracelets",
    description: "Cuffs & Bracelets / دستبند",
  },
] as const;

async function main() {
  const passwordHash = await bcrypt.hash(bootstrapPassword, 10);

  const admins = [
    { phone: "09936537885", name: "Tjay Admin 1" },
    { phone: "09370504588", name: "Tjay Admin 2" },
  ];

  for (const admin of admins) {
    await prisma.user.upsert({
      where: { phone: admin.phone },
      update: {
        name: admin.name,
        role: "ADMIN",
        password_hash: passwordHash,
      },
      create: {
        phone: admin.phone,
        name: admin.name,
        role: "ADMIN",
        password_hash: passwordHash,
      },
    });
  }

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

  const rings = await prisma.category.findUniqueOrThrow({ where: { slug: "rings" } });
  const chains = await prisma.category.findUniqueOrThrow({
    where: { slug: "pendants-chains" },
  });
  const cuffs = await prisma.category.findUniqueOrThrow({
    where: { slug: "cuffs-bracelets" },
  });

  const signet = await prisma.product.upsert({
    where: { slug: "tribal-skull-signet-ring-925" },
    update: {
      title: "Tribal Skull Signet Ring 925",
      description: "نقره استرلینگ دست‌ساز، اسکلت ترایبال، وزن ~16.500g",
      purity: "925",
      base_weight: "16.500",
      status: "ACTIVE",
      category_id: rings.id,
    },
    create: {
      title: "Tribal Skull Signet Ring 925",
      slug: "tribal-skull-signet-ring-925",
      description: "نقره استرلینگ دست‌ساز، اسکلت ترایبال، وزن ~16.500g",
      purity: "925",
      base_weight: "16.500",
      status: "ACTIVE",
      category_id: rings.id,
    },
  });

  for (const size of ["58", "60", "62", "64"]) {
    await prisma.productVariant.upsert({
      where: { sku: `TJ-SKULL-${size}` },
      update: {
        product_id: signet.id,
        ring_size: size,
        price: "0.00",
        stock_quantity: 0,
        additional_weight: "0.000",
      },
      create: {
        product_id: signet.id,
        sku: `TJ-SKULL-${size}`,
        ring_size: size,
        price: "0.00",
        stock_quantity: 0,
        additional_weight: "0.000",
      },
    });
  }

  const chain = await prisma.product.upsert({
    where: { slug: "techno-barbed-wire-heavy-chain-925" },
    update: {
      title: "Techno Barbed Wire Heavy Chain 925",
      description: "زنجیر سیم‌خاردار تکنو نقره، وزن ~42.000g",
      purity: "925",
      base_weight: "42.000",
      status: "ACTIVE",
      category_id: chains.id,
    },
    create: {
      title: "Techno Barbed Wire Heavy Chain 925",
      slug: "techno-barbed-wire-heavy-chain-925",
      description: "زنجیر سیم‌خاردار تکنو نقره، وزن ~42.000g",
      purity: "925",
      base_weight: "42.000",
      status: "ACTIVE",
      category_id: chains.id,
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: "TJ-BARBED-CHAIN" },
    update: {
      product_id: chain.id,
      price: "0.00",
      stock_quantity: 0,
      additional_weight: "0.000",
    },
    create: {
      product_id: chain.id,
      sku: "TJ-BARBED-CHAIN",
      price: "0.00",
      stock_quantity: 0,
      additional_weight: "0.000",
    },
  });

  const cuff = await prisma.product.upsert({
    where: { slug: "cyber-sigilism-engraved-silver-cuff" },
    update: {
      title: "Cyber Sigilism Engraved Silver Cuff",
      description: "دستبند الگوی ترایبال سایبر، وزن ~28.000g",
      purity: "925",
      base_weight: "28.000",
      status: "ACTIVE",
      category_id: cuffs.id,
    },
    create: {
      title: "Cyber Sigilism Engraved Silver Cuff",
      slug: "cyber-sigilism-engraved-silver-cuff",
      description: "دستبند الگوی ترایبال سایبر، وزن ~28.000g",
      purity: "925",
      base_weight: "28.000",
      status: "ACTIVE",
      category_id: cuffs.id,
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: "TJ-CYBER-CUFF" },
    update: {
      product_id: cuff.id,
      price: "0.00",
      stock_quantity: 0,
      additional_weight: "0.000",
    },
    create: {
      product_id: cuff.id,
      sku: "TJ-CYBER-CUFF",
      price: "0.00",
      stock_quantity: 0,
      additional_weight: "0.000",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error instanceof Error ? error.message : "Seed failed");
    await prisma.$disconnect();
    process.exit(1);
  });
