import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
import { visibleCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product] = await visibleCatalog({ productSlug: slug });
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
