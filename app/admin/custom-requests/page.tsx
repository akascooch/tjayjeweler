import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CustomRequestsPage() {
  const requests = await prisma.customRequest.findMany({
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      kind: true,
      status: true,
      contact_phone: true,
      created_at: true,
      product: { select: { title: true } },
    },
  });

  return (
    <section>
      <h2 className="text-2xl font-black tracking-[0.12em] uppercase">Custom requests</h2>
      <p className="mt-3 max-w-xl text-sm text-[var(--muted)]">
        Quotation requests. Contact details stay in the studio.
      </p>
      {requests.length === 0 ? (
        <p className="mt-8 text-sm text-[var(--muted)]">No requests yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {requests.map((request) => (
            <li key={request.id}>
              <Link href={`/admin/custom-requests/${request.id}`} className="flex min-h-11 flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:justify-between">
                <span className="text-sm">
                  {request.kind === "EXISTING_MODEL" ? "Modify" : "New design"}
                  {request.product ? ` · ${request.product.title}` : ""}
                </span>
                <span className="text-xs tracking-[0.14em] text-[var(--muted)] uppercase">
                  {request.status} · {request.contact_phone}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
