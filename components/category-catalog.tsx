import { ProductGrid } from "@/components/product-card";
import { visibleCatalog } from "@/lib/catalog";

export async function CategoryCatalog({
  slug,
  title,
  intro,
}: {
  slug: string;
  title: string;
  intro: string;
}) {
  const products = await visibleCatalog({ categorySlug: slug });

  return (
    <main className="px-6 py-16 md:px-12">
      <h1 className="text-4xl font-black tracking-[0.14em] uppercase">{title}</h1>
      <p className="mt-6 max-w-xl text-sm tracking-wide text-[var(--muted)]">{intro}</p>
      <ProductGrid products={products} />
    </main>
  );
}
