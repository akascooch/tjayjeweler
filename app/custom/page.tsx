import type { Metadata } from "next";
import { CustomRequestForm } from "@/components/custom/custom-request-form";
import { visibleCatalog } from "@/lib/catalog";
import { productPriceCopy } from "@/lib/pricing";
import { publicPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = publicPageMetadata({
  title: "Custom Jewelry",
  description: "Request a quotation for a modified catalog piece or an original sterling silver design from TJAY JEWELER.",
  path: "/custom",
});

export default async function CustomPage() {
  const products = await visibleCatalog({});
  const choices = products.map((product) => {
    const image = product.images.find((item) => item.is_primary) ?? product.images[0];
    return {
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: productPriceCopy(product.show_price, product.variants),
      image: image?.url ?? null,
      alt: image?.alt_text ?? null,
    };
  });

  return (
    <main className="min-w-0 px-4 py-10 sm:px-8 sm:py-14">
      <p className="font-ui editorial-heading text-xs tracking-[0.28em] text-[var(--muted)] uppercase">
        Studio commission
      </p>
      <h1 className="editorial-heading mt-4 max-w-[12ch] text-4xl leading-[0.95] font-medium tracking-[0.06em] uppercase sm:max-w-none sm:text-6xl">
        Custom request
      </h1>
      <p className="editorial-lede mt-6 max-w-xl text-sm leading-7 text-[var(--muted)]">
        Ask the studio to modify a gallery piece or to consider a new design. The reply is a quotation, not an order
        and not a final price.
      </p>
      <div className="mt-10 max-w-3xl">
        <CustomRequestForm products={choices} />
      </div>
    </main>
  );
}
