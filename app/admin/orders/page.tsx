import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    where: { payment_gateway: "card_transfer" },
    orderBy: { created_at: "desc" },
    take: 100,
    select: {
      id: true,
      status: true,
      phone: true,
      email: true,
      total_amount: true,
      created_at: true,
      receipt_image: true,
    },
  });

  return (
    <section>
      <h2 className="text-2xl font-black tracking-[0.12em] uppercase">Orders</h2>
      <p className="mt-3 max-w-xl text-sm text-[var(--muted)]">
        Card-transfer orders awaiting receipt review and fulfillment.
      </p>
      {orders.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--muted)]">No card-transfer orders yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="flex min-h-11 flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between"
              >
                <span className="text-sm">
                  {order.total_amount.toString()} IRT
                  {order.receipt_image ? " · receipt attached" : ""}
                </span>
                <span className="text-xs tracking-[0.14em] text-[var(--muted)] uppercase">
                  {order.status} · {order.phone ?? order.email ?? "no contact"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
