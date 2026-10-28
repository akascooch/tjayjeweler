import Link from "next/link";
import { z } from "zod";
import { ProductGrid } from "@/components/product-card";
import { visibleCatalog } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { productPriceCopy } from "@/lib/pricing";

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
  const [lead, ...rest] = products;
  const leadImage = lead?.images.find((item) => item.is_primary) ?? lead?.images[0];
  const leadLabel = sort === "newest" ? "Most recently added" : "First in the studio sequence";

  return (
    <main className="min-w-0 px-4 py-10 sm:px-8 sm:py-14">
      <section className="gallery-hero relative overflow-hidden border border-[var(--line)] px-4 py-10 sm:px-10 sm:py-16">
        <div className="sigil" aria-hidden="true" />
        <p className="font-ui relative text-xs tracking-[0.28em] text-[var(--muted)] uppercase">Sterling silver</p>
        <h1 className="relative mt-4 max-w-[11ch] text-4xl leading-[0.95] font-medium tracking-[0.06em] uppercase sm:max-w-none sm:text-6xl">
          Selected Artifacts
        </h1>
        <p className="relative mt-6 max-w-xl text-sm leading-7 text-[var(--muted)]">
          Pieces chosen for the gallery. Order follows the studio sequence, not sales.
        </p>
        {lead ? (
          <article className="relative mt-10 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.8fr)] lg:items-end">
            <Link href={`/products/${lead.slug}`} className="block min-w-0 bg-[var(--surface)]">
              {leadImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={leadImage.url}
                  alt={leadImage.alt_text ?? lead.title}
                  className="aspect-[4/5] w-full object-contain"
                />
              ) : (
                <span className="flex aspect-[4/5] items-center justify-center px-6 text-center text-lg tracking-[0.12em] uppercase">
                  {lead.title}
                </span>
              )}
            </Link>
            <div className="min-w-0">
              <p className="font-ui text-xs tracking-[0.2em] text-[var(--muted)] uppercase">{leadLabel}</p>
              <h2 className="mt-3 text-3xl leading-tight font-medium tracking-[0.06em] uppercase">
                <Link href={`/products/${lead.slug}`}>{lead.title}</Link>
              </h2>
              <p className="mt-4 text-sm">{productPriceCopy(lead.show_price, lead.variants)}</p>
            </div>
          </article>
        ) : null}
      </section>

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

      {rest.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-2xl font-medium tracking-[0.08em] uppercase">Also in the gallery</h2>
          <ProductGrid products={rest} />
        </section>
      ) : products.length === 0 ? (
        <ProductGrid products={[]} />
      ) : null}
    </main>
  );
}
