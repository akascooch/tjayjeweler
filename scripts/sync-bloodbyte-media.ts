import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(connectionString),
});

const shots = [
  {
    url: "/images/products/bloodbyte-necklace-1.webp",
    alt_text: "Bloodbyte Necklace",
    is_primary: true,
    sort_order: 0,
  },
];

async function main() {
  const product = await prisma.product.findUnique({
    where: { slug: "bloodbyte-necklace" },
    select: { id: true },
  });
  if (!product) {
    throw new Error("bloodbyte-necklace was not found");
  }

  await prisma.$transaction(async (tx) => {
    for (const shot of shots) {
      const existing = await tx.productImage.findFirst({
        where: { product_id: product.id, url: shot.url },
        select: { id: true },
      });
      if (existing) {
        await tx.productImage.update({
          where: { id: existing.id },
          data: {
            alt_text: shot.alt_text,
            is_primary: shot.is_primary,
            sort_order: shot.sort_order,
          },
        });
      } else {
        await tx.productImage.create({
          data: {
            product_id: product.id,
            url: shot.url,
            alt_text: shot.alt_text,
            is_primary: shot.is_primary,
            sort_order: shot.sort_order,
          },
        });
      }
    }

    const primary = shots.find((shot) => shot.is_primary);
    if (primary) {
      await tx.productImage.updateMany({
        where: {
          product_id: product.id,
          url: { not: primary.url },
          is_primary: true,
        },
        data: { is_primary: false },
      });
    }
  });

  const images = await prisma.productImage.findMany({
    where: { product_id: product.id },
    orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }],
    select: { url: true, is_primary: true, sort_order: true },
  });
  console.log(`BLOODBYTE_MEDIA ${images.length}`);
  for (const image of images) {
    console.log(`${image.sort_order} primary=${image.is_primary} ${image.url}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error instanceof Error ? error.name : "SYNC_FAILED");
    await prisma.$disconnect();
    process.exit(1);
  });
