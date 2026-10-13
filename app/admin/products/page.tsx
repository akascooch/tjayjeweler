import { InventoryTable } from "./inventory-table";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const products = await prisma.product.findMany({
    orderBy: { title: "asc" },
    include: {
      variants: { orderBy: { sku: "asc" } },
    },
  });

  const rows = products.flatMap((product) =>
    product.variants.map((variant) => ({
      id: variant.id,
      productTitle: product.title,
      sku: variant.sku,
      ringSize: variant.ring_size,
      price: variant.price.toFixed(2),
      stockQuantity: variant.stock_quantity,
    })),
  );

  return (
    <section>
      <h2 className="text-2xl font-black tracking-[0.12em] uppercase">Inventory & Pricing</h2>
      <p className="mt-3 max-w-xl text-sm text-[var(--muted)]">
        Update each variant price in IRT and the number of pieces on hand.
      </p>
      <InventoryTable rows={rows} />
    </section>
  );
}
