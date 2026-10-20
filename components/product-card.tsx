import Link from "next/link";
import { OUT_OF_STOCK, productPriceCopy, variantPriceCopy } from "@/lib/pricing";

type CatalogVariant = {
  sku: string;
  price: string;
  stock_quantity: number;
  ring_size: string | null;
  chain_length: string | null;
  show_price_override: boolean | null;
};

type CatalogImage = {
  url: string;
  alt_text: string | null;
  is_primary: boolean;
};

export type CatalogProduct = {
  title: string;
  slug: string;
  description: string | null;
  show_price: boolean;
  variants: CatalogVariant[];
  images: CatalogImage[];
};

export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  if (products.length === 0) {
    return <p className="mt-8 text-sm text-[var(--muted)]">No pieces are listed yet.</p>;
  }

  return (
    <div className="mt-10 grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => {
        const image = product.images.find((item) => item.is_primary) ?? product.images[0];
        const unavailable = product.variants.length > 0 && product.variants.every((variant) => variant.stock_quantity === 0);
        return (
          <article key={product.slug} className="flex min-w-0 flex-col border border-[var(--line)] bg-[var(--surface)]">
            <Link
              href={`/products/${product.slug}`}
              tabIndex={-1}
              aria-hidden
              className="block aspect-[4/5] border-b border-[var(--line)] bg-[var(--surface)]"
            >
              {image ? (
                // Admin image URLs can be remote, so they stay outside the image optimizer.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={image.url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="flex h-full items-center justify-center px-6 text-center text-lg font-bold tracking-[0.22em] uppercase">
                  {product.title}
                </span>
              )}
            </Link>
            <div className="p-5">
              <h2 className="text-lg leading-tight font-medium tracking-[0.06em] uppercase">
                <Link href={`/products/${product.slug}`}>{product.title}</Link>
              </h2>
              <p className="mt-3 text-sm">{productPriceCopy(product.show_price, product.variants)}</p>
              {unavailable ? (
                <p className="mt-2 text-xs tracking-[0.16em] text-[var(--muted)] uppercase">{OUT_OF_STOCK}</p>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function VariantPrices({ product }: { product: CatalogProduct }) {
  return (
    <ul className="mt-8 space-y-3">
      {product.variants.map((variant) => (
        <li key={variant.sku} className="flex flex-wrap items-baseline justify-between gap-3 border-t border-[var(--line)] py-3">
          <span className="text-sm">
            {variant.sku}
            {variant.ring_size ? ` · ${variant.ring_size}` : ""}
            {variant.chain_length ? ` · ${variant.chain_length}` : ""}
          </span>
          <span className="text-sm">
            {variantPriceCopy(product.show_price, variant.show_price_override, variant.price)}
            {variant.stock_quantity === 0 ? ` · ${OUT_OF_STOCK}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
