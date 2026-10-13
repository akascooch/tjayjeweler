import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [products, variants, stock] = await Promise.all([
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.productVariant.aggregate({ _sum: { stock_quantity: true } }),
  ]);

  const stats = [
    { label: "Products", value: products },
    { label: "Variants", value: variants },
    { label: "Units in stock", value: stock._sum.stock_quantity ?? 0 },
  ];

  return (
    <section>
      <h2 className="text-2xl font-black tracking-[0.12em] uppercase">Overview</h2>
      <p className="mt-3 max-w-xl text-sm text-[var(--muted)]">
        Sterling catalog, prices in IRT, and studio access.
      </p>
      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-[var(--line)] px-4 py-5">
            <dt className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
              {stat.label}
            </dt>
            <dd className="mt-3 text-3xl font-black">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
