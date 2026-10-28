import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [products, visible, outOfStock, openRequests] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { is_visible: true, status: "ACTIVE" } }),
    prisma.productVariant.count({ where: { stock_quantity: 0 } }),
    prisma.customRequest.count({ where: { status: "NEW" } }),
  ]);

  const stats = [
    { label: "Products", value: products },
    { label: "Visible", value: visible },
    { label: "Out of stock", value: outOfStock },
    { label: "New requests", value: openRequests },
  ];

  const links = [
    { href: "/admin/products", label: "Products" },
    { href: "/admin/categories", label: "Categories" },
    { href: "/admin/custom-requests", label: "Requests" },
    { href: "/admin/settings", label: "Settings" },
  ];

  return (
    <section>
      <h2 className="text-2xl font-black tracking-[0.12em] uppercase">Overview</h2>
      <p className="mt-3 max-w-xl text-sm text-[var(--muted)]">
        Catalog, visibility, and studio access.
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
      <div className="mt-8 flex flex-wrap gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="border border-[var(--ink)] px-4 py-2 text-xs font-semibold tracking-[0.16em] uppercase"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
