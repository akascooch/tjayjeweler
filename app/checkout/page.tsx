"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { formatIrt, formatRial } from "@/lib/cart";
import { useCartStore } from "@/lib/store/cart-store";

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          acc.itemCount += item.quantity;
          acc.subtotalIrt += item.unitPriceIrt * item.quantity;
          return acc;
        },
        { itemCount: 0, subtotalIrt: 0 },
      ),
    [items],
  );
  const subtotalIrt = Math.round(totals.subtotalIrt * 100) / 100;
  const subtotalRial = Math.round(subtotalIrt * 10);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0 || busy) return;
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email,
          phone,
          items: items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { paymentUrl?: string; message?: string }
        | null;
      if (!response.ok || !payload?.paymentUrl) {
        setError(payload?.message ?? "Checkout failed.");
        setBusy(false);
        return;
      }
      window.location.assign(payload.paymentUrl);
    } catch {
      setError("Checkout failed.");
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8">
      <p className="font-ui text-xs tracking-[0.28em] text-[var(--muted)] uppercase">Checkout</p>
      <h1 className="editorial-heading mt-3 text-3xl font-bold tracking-[0.14em] uppercase md:text-4xl">
        Secure Payment
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-7 text-white/80">
        Review your bag, leave a contact email, and continue to Zarinpal. Amounts are shown in Toman (IRT) and Rial.
      </p>

      {items.length === 0 ? (
        <div className="mt-10 border border-[var(--line)] px-5 py-8">
          <p className="font-ui text-sm tracking-[0.14em] uppercase">Your bag is empty.</p>
          <Link href="/" className="font-ui mt-4 inline-flex text-xs tracking-[0.18em] uppercase underline">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <ul className="grid gap-4">
            {items.map((item) => (
              <li key={item.variantId} className="border border-[var(--line)] px-4 py-4">
                <p className="font-ui text-sm tracking-[0.12em] uppercase">{item.title}</p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {[item.sku, item.ringSize, item.chainLength, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-3 text-sm">{formatIrt(item.unitPriceIrt * item.quantity)}</p>
              </li>
            ))}
          </ul>

          <form onSubmit={onSubmit} className="border border-[var(--line)] px-4 py-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-ui text-xs tracking-[0.18em] uppercase">Subtotal</p>
              <div className="text-right">
                <p className="text-sm">{formatIrt(subtotalIrt)}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{formatRial(subtotalRial)}</p>
              </div>
            </div>

            <label className="mt-6 block">
              <span className="font-ui text-xs tracking-[0.16em] uppercase">Email</span>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="mt-2 min-h-11 w-full border border-[var(--line-strong)] bg-transparent px-3 text-sm"
              />
            </label>

            <label className="mt-4 block">
              <span className="font-ui text-xs tracking-[0.16em] uppercase">Mobile (optional)</span>
              <input
                type="tel"
                name="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="09xxxxxxxxx"
                autoComplete="tel"
                className="mt-2 min-h-11 w-full border border-[var(--line-strong)] bg-transparent px-3 text-sm"
              />
            </label>

            {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

            <button
              type="submit"
              disabled={busy}
              className="font-ui mt-6 inline-flex min-h-11 w-full items-center justify-center border border-white bg-white px-4 text-xs font-bold tracking-[0.2em] text-black uppercase disabled:opacity-60"
            >
              {busy ? "Connecting…" : "Pay with Zarinpal"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
