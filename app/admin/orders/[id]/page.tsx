import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderReviewForm } from "@/app/admin/orders/[id]/review-form";
import { isRecordId } from "@/lib/admin";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!isRecordId(id)) notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          variant: {
            select: {
              sku: true,
              ring_size: true,
              chain_length: true,
              product: { select: { title: true } },
            },
          },
        },
      },
    },
  });
  if (!order || order.payment_gateway !== "card_transfer") notFound();

  return (
    <section>
      <p className="text-xs tracking-[0.18em] text-[var(--muted)] uppercase">
        <Link href="/admin/orders" className="hover:text-white">
          Orders
        </Link>
        {" / "}
        {order.id}
      </p>
      <h2 className="mt-3 text-2xl font-black tracking-[0.12em] uppercase">Order review</h2>
      <p className="mt-3 text-sm text-[var(--muted)]">
        Status {order.status} · {order.total_amount.toString()} IRT
      </p>

      <dl className="mt-8 grid max-w-xl gap-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-[var(--line)] py-2">
          <dt className="text-[var(--muted)]">Phone</dt>
          <dd>{order.phone ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-[var(--line)] py-2">
          <dt className="text-[var(--muted)]">Email</dt>
          <dd>{order.email ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-[var(--line)] py-2">
          <dt className="text-[var(--muted)]">Gateway</dt>
          <dd>{order.payment_gateway}</dd>
        </div>
      </dl>

      <ul className="mt-8 max-w-xl space-y-3 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="border border-[var(--line)] px-4 py-3">
            <p className="font-ui tracking-[0.12em] uppercase">{item.variant.product.title}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {[
                item.variant.sku,
                item.variant.ring_size,
                item.variant.chain_length,
                `Qty ${item.quantity}`,
                `${item.unit_price.toString()} IRT`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </li>
        ))}
      </ul>

      {order.receipt_image ? (
        <div className="mt-8 max-w-xl">
          <p className="text-xs tracking-[0.16em] uppercase">Receipt</p>
          {/* Admin-only private receipt route; keep outside next/image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/admin/orders/${order.id}/receipt`}
            alt="Payment receipt"
            className="mt-3 max-h-[32rem] w-full border border-[var(--line)] object-contain bg-black"
          />
        </div>
      ) : (
        <p className="mt-8 text-sm text-[var(--muted)]">No receipt uploaded.</p>
      )}

      <OrderReviewForm id={order.id} status={order.status} staffNote={order.staff_note} />
    </section>
  );
}
