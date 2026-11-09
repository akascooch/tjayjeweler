"use client";

import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef } from "react";
import { cartTotals, formatIrt, formatRial } from "@/lib/cart";
import { useCartStore } from "@/lib/store/cart-store";

export function CartDrawer() {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = useCartStore((state) => state.open);
  const items = useCartStore((state) => state.items);
  const setOpen = useCartStore((state) => state.setOpen);
  const removeItem = useCartStore((state) => state.removeItem);
  const setQuantity = useCartStore((state) => state.setQuantity);
  // Never call totals() inside a Zustand selector — it returns a new object each time and
  // trips useSyncExternalStore into an infinite re-render (React #185).
  const totals = useMemo(
    () =>
      cartTotals(
        items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPriceIrt: item.unitPriceIrt,
        })),
      ),
    [items],
  );

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close bag"
        className="absolute inset-0 bg-black/60"
        onClick={() => setOpen(false)}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 right-0 flex w-[min(100%,24rem)] flex-col border-l border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] shadow-none"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          <p id={titleId} className="font-ui inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase">
            <ShoppingBag size={16} aria-hidden />
            Bag ({totals.itemCount})
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close bag"
            className="inline-flex h-11 w-11 items-center justify-center border border-[var(--line-strong)]"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <p className="font-ui text-sm tracking-[0.12em] text-[var(--muted)] uppercase">Your bag is empty.</p>
          ) : (
            <ul className="grid gap-4">
              {items.map((item) => (
                <li key={item.variantId} className="grid grid-cols-[4.5rem_1fr] gap-3 border-b border-[var(--line)] pb-4">
                  <div className="relative aspect-square border border-[var(--line)] bg-black">
                    {item.imageUrl ? (
                      // Remote/admin URLs stay outside the optimizer.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[0.6rem] tracking-[0.16em] uppercase">
                        TJAY
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/products/${item.productSlug}`}
                      className="font-ui block truncate text-sm tracking-[0.12em] uppercase"
                      onClick={() => setOpen(false)}
                    >
                      {item.title}
                    </Link>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {[item.sku, item.ringSize, item.chainLength].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-2 text-sm">{formatIrt(item.unitPriceIrt)}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Decrease quantity for ${item.title}`}
                        onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                        className="inline-flex h-9 w-9 items-center justify-center border border-[var(--line-strong)]"
                      >
                        <Minus size={14} aria-hidden />
                      </button>
                      <span className="font-ui min-w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase quantity for ${item.title}`}
                        disabled={item.quantity >= item.stockQuantity}
                        onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                        className="inline-flex h-9 w-9 items-center justify-center border border-[var(--line-strong)] disabled:opacity-40"
                      >
                        <Plus size={14} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.variantId)}
                        className="font-ui ml-auto text-xs tracking-[0.16em] text-[var(--muted)] uppercase hover:text-white"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-[var(--line)] px-4 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-ui text-xs tracking-[0.18em] uppercase">Subtotal</p>
            <div className="text-right">
              <p className="text-sm">{formatIrt(totals.subtotalIrt)}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{formatRial(totals.subtotalRial)}</p>
            </div>
          </div>
          <Link
            href="/checkout"
            onClick={() => setOpen(false)}
            aria-disabled={items.length === 0}
            className={`font-ui mt-4 inline-flex min-h-11 w-full items-center justify-center border px-4 text-xs font-bold tracking-[0.2em] uppercase ${
              items.length === 0
                ? "pointer-events-none border-[var(--line)] text-[var(--muted)]"
                : "border-white bg-white text-black hover:bg-[var(--paper)] hover:text-white"
            }`}
          >
            Proceed to Checkout
          </Link>
        </div>
      </aside>
    </div>
  );
}

export function CartHeaderButton() {
  const hydrated = useCartStore((state) => state.hydrated);
  const itemCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + (Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 0), 0),
  );
  const setOpen = useCartStore((state) => state.setOpen);
  const count = hydrated ? itemCount : 0;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={count > 0 ? `Open bag, ${count} items` : "Open bag"}
      className="relative z-20 inline-flex h-11 w-11 shrink-0 items-center justify-center border border-[var(--line-strong)]"
    >
      <ShoppingBag size={18} aria-hidden />
      {count > 0 ? (
        <span className="absolute -top-1 -right-1 inline-flex min-h-4 min-w-4 items-center justify-center bg-white px-1 text-[0.65rem] font-bold text-black">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}
