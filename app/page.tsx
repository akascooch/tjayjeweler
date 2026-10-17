import Link from "next/link";
import { z } from "zod";
import { ProductGrid } from "@/components/product-card";
import { paidUnitsByVariant, visibleCatalog } from "@/lib/catalog";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const sortSchema = z.enum(["newest", "best-selling"]).catch("newest");
type Sort = z.infer<typeof sortSchema>;

const sorts: { value: Sort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "best-selling", label: "Best Selling" },
];

function catalogHref(category: string | null, sort: Sort) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (sort !== "newest") params.set("sort", sort);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function chipClass(active: boolean) {
  return `inline-flex min-h-9 items-center border px-4 text-xs font-semibold tracking-[0.16em] uppercase ${
    active ? "border-white bg-white text-black" : "border-[var(--line-strong)] hover:border-white"
  }`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const sort = sortSchema.parse(params.sort);
  const categories = await prisma.category.findMany({
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    select: { slug: true, name: true },
  });
  const category = categories.some((item) => item.slug === params.category) ? params.category! : null;

  const newest = await visibleCatalog({ categorySlug: category ?? undefined, order: "newest" });
  let products = newest;
  let rankedBySales = false;
  if (sort === "best-selling") {
    const units = await paidUnitsByVariant();
    if (units.size > 0) {
      rankedBySales = true;
      const sold = (product: (typeof newest)[number]) =>
        product.variants.reduce((total, variant) => total + (units.get(variant.id) ?? 0), 0);
      products = [...newest].sort((left, right) => sold(right) - sold(left));
    }
  }

  return (
    <main className="px-6 py-16 md:px-12">
      <p className="text-xs font-semibold tracking-[0.32em] text-[var(--muted)] uppercase">TJAY JEWELER</p>
      <h1 className="mt-3 text-4xl font-bold tracking-[0.14em] uppercase md:text-5xl">Catalog</h1>
      <p className="mt-6 max-w-xl text-sm tracking-wide text-[var(--muted)]">Sterling silver jewelry.</p>

      <div className="mt-10 flex flex-col gap-6 border-y border-[var(--line)] py-6 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter by category" className="flex flex-wrap gap-2">
          <Link href={catalogHref(null, sort)} aria-current={category === null ? "page" : undefined} className={chipClass(category === null)}>
            All
          </Link>
          {categories.map((item) => (
            <Link
              key={item.slug}
              href={catalogHref(item.slug, sort)}
              aria-current={category === item.slug ? "page" : undefined}
              className={chipClass(category === item.slug)}
            >
              {item.name}
            </Link>
          ))}
        </nav>
        <nav aria-label="Sort products" className="flex flex-wrap items-center gap-2">
          <span className="mr-2 text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">Sort</span>
          {sorts.map((item) => (
            <Link
              key={item.value}
              href={catalogHref(category, item.value)}
              aria-current={sort === item.value ? "page" : undefined}
              className={chipClass(sort === item.value)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {sort === "best-selling" && !rankedBySales ? (
        <p className="mt-6 text-xs tracking-[0.16em] text-[var(--muted)] uppercase">
          No sales recorded yet. Showing newest pieces.
        </p>
      ) : null}

      <ProductGrid products={products} />
    </main>
  );
}
