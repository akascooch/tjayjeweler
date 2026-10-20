import { ProductGrid } from "@/components/product-card";
import { visibleCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const query = (await searchParams).q?.trim() ?? "";
  const products = query ? await visibleCatalog({ search: query }) : [];

  return (
    <main className="px-6 py-16 md:px-12">
      <h1 className="text-4xl font-black tracking-[0.14em] uppercase">Search</h1>
      <p className="mt-6 max-w-xl text-sm tracking-wide text-[var(--muted)]">
        {query ? `Results for “${query}”.` : "Enter a search from the header."}
      </p>
      {query ? <ProductGrid products={products} /> : null}
    </main>
  );
}
