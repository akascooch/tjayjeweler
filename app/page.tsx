import Link from "next/link";
import { z } from "zod";
import { HomePanels } from "@/components/home-panels";
import { ProductGrid } from "@/components/product-card";
import { ProductScroller, type ProductSlide } from "@/components/product-scroller";
import { visibleCatalog } from "@/lib/catalog";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const sortSchema = z.enum(["selected", "newest"]).catch("selected");
type Sort = z.infer<typeof sortSchema>;

const sorts: { value: Sort; label: string }[] = [
  { value: "selected", label: "Selected" },
  { value: "newest", label: "Newest" },
];

function catalogHref(category: string | null, sort: Sort) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (sort !== "selected") params.set("sort", sort);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function chipClass(active: boolean) {
  return `font-ui inline-flex min-h-11 items-center border px-4 text-xs tracking-[0.14em] uppercase ${
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
  const products = await visibleCatalog({
    categorySlug: category ?? undefined,
    order: sort === "newest" ? "newest" : "curated",
  });
  const slides: ProductSlide[] = products.map((product) => {
    const image = product.images.find((item) => item.is_primary) ?? product.images[0];
    return {
      slug: product.slug,
      title: product.title,
      imageUrl: image?.url ?? null,
      imageAlt: image?.alt_text?.trim() || product.title,
    };
  });

  return (
    <main className="min-w-0 px-4 py-10 sm:px-8 sm:py-14">
      <ProductScroller products={slides} />
      <HomePanels />

      <div className="mt-10 flex min-w-0 flex-col gap-6 border-y border-[var(--line)] py-6">
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
          <span className="font-ui mr-1 text-xs tracking-[0.16em] text-[var(--muted)] uppercase">Order</span>
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

      <section className="mt-12" aria-labelledby="catalog-heading">
        <h2 id="catalog-heading" className="sr-only">
          Catalog
        </h2>
        <ProductGrid products={products} />
      </section>
    </main>
  );
}
