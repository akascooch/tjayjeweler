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

const names: Record<string, string> = {
  rings: "RINGS",
  "pendants-chains": "PENDANTS & CHAINS",
  "cuffs-bracelets": "CUFFS & BRACELETS",
};

async function productCounts() {
  const rows = await prisma.category.findMany({
    where: { slug: { in: Object.keys(names) } },
    select: { slug: true, _count: { select: { products: true } } },
  });
  return new Map(rows.map((row) => [row.slug, row._count.products]));
}

async function main() {
  const before = await productCounts();

  await prisma.$transaction(async (tx) => {
    const categories = await tx.category.findMany({
      where: { slug: { in: Object.keys(names) } },
      select: { id: true, slug: true, name: true },
    });
    const missing = Object.keys(names).filter((slug) => !categories.some((item) => item.slug === slug));
    if (missing.length > 0) {
      throw new Error(`Missing categories: ${missing.join(", ")}`);
    }

    for (const category of categories) {
      const name = names[category.slug];
      if (category.name === name) {
        console.log(`UNCHANGED ${category.slug} "${name}"`);
        continue;
      }
      await tx.category.update({ where: { id: category.id }, data: { name } });
      console.log(`UPDATED ${category.slug} "${category.name}" -> "${name}"`);
    }
  });

  const after = await productCounts();
  for (const slug of Object.keys(names)) {
    console.log(`PRODUCTS ${slug} before=${before.get(slug)} after=${after.get(slug)}`);
    if (before.get(slug) !== after.get(slug)) {
      throw new Error(`Product count changed for ${slug}`);
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error instanceof Error ? `${error.name}: ${error.message}` : "NORMALIZE_FAILED");
    await prisma.$disconnect();
    process.exit(1);
  });
