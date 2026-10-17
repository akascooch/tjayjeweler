import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProductDetail } from "@/components/product/product-detail";
import { visibleCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

const findProduct = cache(async (slug: string) => {
  const [product] = await visibleCatalog({ productSlug: slug });
  return product ?? null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await findProduct((await params).slug);
  if (!product) return { title: "Not found · TJAY JEWELER" };

  const summary = product.description?.split("\n").find((line) => line.trim())?.trim() ?? "Sterling silver jewelry";
  const description = summary.length > 160 ? `${summary.slice(0, 157).trimEnd()}…` : summary;
  const image = product.images[0];
  const title = `${product.title} · TJAY JEWELER`;

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      url: `/products/${product.slug}`,
      type: "website",
      images: image ? [{ url: image.url, alt: image.alt_text ?? product.title }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await findProduct((await params).slug);
  if (!product) notFound();

  return (
    <ProductDetail
      product={{
        title: product.title,
        slug: product.slug,
        description: product.description,
        purity: product.purity,
        show_price: product.show_price,
        category: product.category,
        variants: product.variants,
        images: product.images,
      }}
    />
  );
}
