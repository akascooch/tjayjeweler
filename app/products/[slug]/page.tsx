import { notFound } from "next/navigation";
import { VariantPrices } from "@/components/product-card";
import { visibleCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product] = await visibleCatalog({ productSlug: slug });
  if (!product) notFound();
  const image = product.images.find((item) => item.is_primary) ?? product.images[0];

  return (
    <main className="px-6 py-16 md:px-12">
      <p className="text-xs font-semibold tracking-[0.28em] text-[var(--muted)] uppercase">
        {product.category.name}
      </p>
      <h1 className="mt-3 text-4xl font-black tracking-[0.12em] uppercase">{product.title}</h1>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image.url}
          alt={image.alt_text ?? product.title}
          className="mt-8 max-h-[32rem] w-full max-w-3xl object-cover"
        />
      ) : null}
      {product.description ? (
        <p className="mt-8 max-w-2xl text-sm whitespace-pre-wrap text-[var(--muted)]">{product.description}</p>
      ) : null}
      <VariantPrices product={product} />
    </main>
  );
}
