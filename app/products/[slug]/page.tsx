import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProductDetail } from "@/components/product/product-detail";
import { visibleCatalog } from "@/lib/catalog";
import { DEFAULT_OG_IMAGE, SITE_NAME, publicPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

const findProduct = cache(async (slug: string) => {
  const [product] = await visibleCatalog({ productSlug: slug });
  return product ?? null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await findProduct((await params).slug);
  if (!product) return { title: `Not found · ${SITE_NAME}`, robots: { index: false, follow: false } };

  const summary =
    product.description?.split("\n").find((line) => line.trim())?.trim() ??
    `${product.title} in sterling silver from ${SITE_NAME}.`;
  const description = summary.length > 160 ? `${summary.slice(0, 157).trimEnd()}…` : summary;
  const image = product.images.find((item) => item.is_primary) ?? product.images[0];

  return publicPageMetadata({
    title: product.title,
    description,
    path: `/products/${product.slug}`,
    images: [image?.url ?? DEFAULT_OG_IMAGE],
  });
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
