import { prisma } from "@/lib/db";

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  variants: { orderBy: { sku: "asc" as const } },
  images: { orderBy: [{ is_primary: "desc" as const }, { sort_order: "asc" as const }] },
};

export function serializeVariant(variant: {
  id: string;
  sku: string;
  price: { toFixed: (digits: number) => string };
  stock_quantity: number;
  additional_weight: { toFixed: (digits: number) => string };
  ring_size: string | null;
  chain_length: string | null;
  show_price_override: boolean | null;
}) {
  return {
    id: variant.id,
    sku: variant.sku,
    price: variant.price.toFixed(2),
    stock_quantity: variant.stock_quantity,
    weight_grams: variant.additional_weight.toFixed(3),
    ring_size: variant.ring_size,
    chain_length: variant.chain_length,
    show_price_override: variant.show_price_override,
  };
}

export function serializeImage(image: {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}) {
  return {
    id: image.id,
    url: image.url,
    alt_text: image.alt_text,
    is_primary: image.is_primary,
    sort_order: image.sort_order,
  };
}

export function serializeProduct(product: {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  purity: string;
  base_weight: { toFixed: (digits: number) => string };
  is_visible: boolean;
  show_price: boolean;
  sort_order: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  category_id: string;
  category: { id: string; name: string; slug: string };
  variants: Parameters<typeof serializeVariant>[0][];
  images: Parameters<typeof serializeImage>[0][];
}) {
  return {
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
    category: product.category,
    variants: product.variants.map(serializeVariant),
    images: product.images.map(serializeImage),
  };
}

export async function listAdminProducts() {
  const products = await prisma.product.findMany({
    orderBy: [{ sort_order: "asc" }, { title: "asc" }],
    include: productInclude,
  });
  return products.map(serializeProduct);
}

export async function visibleCatalog(where: {
  categorySlug?: string;
  productSlug?: string;
  search?: string;
}) {
  const search = where.search?.trim();
  const products = await prisma.product.findMany({
    where: {
      is_visible: true,
      status: "ACTIVE",
      ...(where.categorySlug ? { category: { slug: where.categorySlug } } : {}),
      ...(where.productSlug ? { slug: where.productSlug } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { slug: { contains: search, mode: "insensitive" } },
              { variants: { some: { sku: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    orderBy: [{ sort_order: "asc" }, { title: "asc" }],
    include: productInclude,
  });
  return products.map(serializeProduct);
}
