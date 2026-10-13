import { ProductList } from "./product-list";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: [{ sort_order: "asc" }, { title: "asc" }],
      include: {
        category: { select: { name: true } },
        variants: { select: { sku: true, stock_quantity: true } },
      },
    }),
    prisma.category.findMany({ orderBy: [{ sort_order: "asc" }, { name: "asc" }] }),
  ]);

  return (
    <section>
      <h2 className="text-2xl font-black tracking-[0.12em] uppercase">Products</h2>
      <p className="mt-3 max-w-xl text-sm text-[var(--muted)]">
        Visibility and price display apply on the public catalog.
      </p>
      <ProductList
        products={products.map((product) => ({
          id: product.id,
          title: product.title,
          slug: product.slug,
          is_visible: product.is_visible,
          show_price: product.show_price,
          status: product.status,
          category_id: product.category_id,
          category: product.category,
          variants: product.variants,
        }))}
        categories={categories.map((category) => ({ id: category.id, name: category.name }))}
      />
    </section>
  );
}
