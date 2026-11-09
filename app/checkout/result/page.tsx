import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutResultEffects } from "@/components/checkout-result-effects";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Order result",
  description: "TJAY JEWELER order and payment receipt status.",
  path: "/checkout/result",
  index: false,
});

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function CheckoutResultPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const status = first(params.status);
  const orderId = first(params.orderId);
  const refId = first(params.refId);
  const amount = first(params.amount);
  const message = first(params.message);
  const pending = status === "pending_verification";
  const paid = status === "paid";

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-8">
      <CheckoutResultEffects paid={pending || paid} />
      <p className="font-ui text-xs tracking-[0.28em] text-[var(--muted)] uppercase">Order result</p>
      <h1 className="editorial-heading mt-3 text-3xl font-bold tracking-[0.14em] uppercase md:text-4xl">
        {pending ? "Receipt received" : paid ? "Payment confirmed" : "Order not completed"}
      </h1>
      <p className="mt-4 text-sm leading-7 text-white/80">
        {pending
          ? "Thank you. Your receipt is waiting for studio verification. We will contact you after review."
          : paid
            ? "Payment was confirmed."
            : message || "The order could not be completed."}
      </p>

      <dl className="mt-8 grid gap-3 border border-[var(--line)] px-4 py-5 text-sm">
        {orderId ? (
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">Order</dt>
            <dd className="font-mono text-xs break-all">{orderId}</dd>
          </div>
        ) : null}
        {refId ? (
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">Ref ID</dt>
            <dd className="font-mono text-xs break-all">{refId}</dd>
          </div>
        ) : null}
        {amount ? (
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--muted)]">Amount</dt>
            <dd>{amount} IRT</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-[var(--muted)]">Status</dt>
          <dd className="uppercase tracking-[0.14em]">{status || "unknown"}</dd>
        </div>
      </dl>

      <Link
        href="/"
        className="font-ui mt-8 inline-flex min-h-11 items-center border border-white px-5 text-xs font-bold tracking-[0.2em] uppercase"
      >
        Back to store
      </Link>
    </main>
  );
}
