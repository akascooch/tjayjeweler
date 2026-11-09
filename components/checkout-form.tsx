"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { formatIrt, formatRial } from "@/lib/cart";
import { formatCardNumber } from "@/lib/store-settings-schema";
import { useCartStore } from "@/lib/store/cart-store";

export function CheckoutForm({
  bank,
}: {
  bank: {
    configured: boolean;
    bank_card_number: string;
    bank_card_holder: string;
    bank_name: string;
  };
}) {
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
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
  const [receiptName, setReceiptName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function copyCard() {
    if (!bank.bank_card_number) return;
    try {
      await navigator.clipboard.writeText(bank.bank_card_number);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0 || busy) return;
    setBusy(true);
    setError("");

    const form = event.currentTarget;
    const receiptInput = form.elements.namedItem("receipt");
    const file =
      receiptInput instanceof HTMLInputElement && receiptInput.files?.[0] ? receiptInput.files[0] : null;
    if (!file) {
      setError("Upload a payment receipt image.");
      setBusy(false);
      return;
    }

    try {
      const body = new FormData();
      body.set("email", email);
      body.set("phone", phone);
      body.set("items", JSON.stringify(items.map((item) => ({ variantId: item.variantId, quantity: item.quantity }))));
      body.set("receipt", file);

      const response = await fetch("/api/orders", {
        method: "POST",
        body,
      });
      const payload = (await response.json().catch(() => null)) as
        | { orderId?: string; amountIrt?: number; message?: string }
        | null;
      if (!response.ok || !payload?.orderId) {
        setError(payload?.message ?? "Order failed.");
        setBusy(false);
        return;
      }
      clear();
      const params = new URLSearchParams({
        status: "pending_verification",
        orderId: payload.orderId,
        amount: String(payload.amountIrt ?? subtotalIrt),
      });
      window.location.assign(`/checkout/result?${params.toString()}`);
    } catch {
      setError("Order failed.");
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mt-10 border border-[var(--line)] px-5 py-8">
        <p className="font-ui text-sm tracking-[0.14em] uppercase">Your bag is empty.</p>
        <Link href="/" className="font-ui mt-4 inline-flex text-xs tracking-[0.18em] uppercase underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  if (!bank.configured) {
    return (
      <div className="mt-10 border border-[var(--line)] px-5 py-8">
        <p className="font-ui text-sm tracking-[0.14em] uppercase">Checkout unavailable</p>
        <p className="mt-3 text-sm text-white/80">
          Card transfer details are not configured yet. Please contact the studio or try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="grid gap-4">
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

        <section className="border border-[var(--line)] px-4 py-5">
          <p className="font-ui text-xs tracking-[0.18em] uppercase">Transfer to this card</p>
          <p className="mt-3 text-sm text-white/80">{bank.bank_name}</p>
          <p className="mt-1 text-sm text-white/80">{bank.bank_card_holder}</p>
          <p className="mt-4 font-mono text-lg tracking-[0.12em]">
            {formatCardNumber(bank.bank_card_number)}
          </p>
          <button
            type="button"
            onClick={() => void copyCard()}
            className="font-ui mt-4 inline-flex min-h-11 items-center border border-[var(--line-strong)] px-4 text-xs tracking-[0.16em] uppercase"
          >
            {copied ? "Copied" : "Copy card number"}
          </button>
          <p className="mt-4 text-sm leading-7 text-white/75">
            Transfer exactly {formatIrt(subtotalIrt)} ({formatRial(subtotalRial)}), then upload the receipt below.
          </p>
        </section>
      </div>

      <form onSubmit={onSubmit} className="border border-[var(--line)] px-4 py-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-ui text-xs tracking-[0.18em] uppercase">Subtotal</p>
          <div className="text-right">
            <p className="text-sm">{formatIrt(subtotalIrt)}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{formatRial(subtotalRial)}</p>
          </div>
        </div>

        <label className="mt-6 block">
          <span className="font-ui text-xs tracking-[0.16em] uppercase">Email (optional)</span>
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
          <span className="font-ui text-xs tracking-[0.16em] uppercase">Mobile</span>
          <input
            type="tel"
            name="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="09xxxxxxxxx"
            autoComplete="tel"
            required
            className="mt-2 min-h-11 w-full border border-[var(--line-strong)] bg-transparent px-3 text-sm"
          />
        </label>

        <label className="mt-4 block">
          <span className="font-ui text-xs tracking-[0.16em] uppercase">Payment receipt</span>
          <input
            type="file"
            name="receipt"
            accept="image/jpeg,image/png,image/webp"
            required
            onChange={(event) => setReceiptName(event.target.files?.[0]?.name ?? "")}
            className="mt-2 block w-full text-sm file:mr-3 file:border file:border-[var(--line-strong)] file:bg-transparent file:px-3 file:py-2 file:text-xs file:tracking-[0.14em] file:uppercase"
          />
          {receiptName ? <p className="mt-2 text-xs text-[var(--muted)]">{receiptName}</p> : null}
        </label>

        {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

        <button
          type="submit"
          disabled={busy}
          className="font-ui mt-6 inline-flex min-h-11 w-full items-center justify-center border border-white bg-white px-4 text-xs font-bold tracking-[0.2em] text-black uppercase disabled:opacity-60"
        >
          {busy ? "Submitting…" : "Submit order & receipt"}
        </button>
      </form>
    </div>
  );
}
