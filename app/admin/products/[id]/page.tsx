import { notFound } from "next/navigation";
import { ProductEditor } from "./product-editor";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { sku: "asc" } },
        images: { orderBy: [{ is_primary: "desc" }, { sort_order: "asc" }] },
      },
    }),
    prisma.category.findMany({
      orderBy: [{ sort_order: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  if (!product) notFound();

  return (
    <section>
      <h2 className="text-2xl font-black tracking-[0.12em] uppercase">{product.title}</h2>
      <div className="mt-8">
        <ProductEditor
          categories={categories}
          product={{
            id: product.id,
            title: product.title,
            slug: product.slug,
            description: product.description,
            purity: product.purity,
            base_weight: product.base_weight.toFixed(3),
            is_visible: product.is_visible,
            show_price: product.show_price,
            sort_order: product.sort_order,
            status: product.status,
            category_id: product.category_id,
            variants: product.variants.map((variant) => ({
              id: variant.id,
              sku: variant.sku,
              price: variant.price.toFixed(2),
              stock_quantity: variant.stock_quantity,
              weight_grams: variant.additional_weight.toFixed(3),
              ring_size: variant.ring_size,
              show_price_override: variant.show_price_override,
            })),
            images: product.images.map((image) => ({
              id: image.id,
              url: image.url,
              alt_text: image.alt_text,
              is_primary: image.is_primary,
              sort_order: image.sort_order,
            })),
          }}
        />
      </div>
    </section>
  );
}
