import { CategoryManager } from "./category-manager";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });

  return (
    <section>
      <h2 className="text-2xl font-black tracking-[0.12em] uppercase">Categories</h2>
      <p className="mt-3 max-w-xl text-sm text-[var(--muted)]">
        A category with products stays in place until those products are moved.
      </p>
      <CategoryManager
        categories={categories.map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          sort_order: category.sort_order,
          product_count: category._count.products,
        }))}
      />
    </section>
  );
}
