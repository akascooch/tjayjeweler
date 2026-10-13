"use client";

import { FormEvent, useState } from "react";

export type InventoryRow = {
  id: string;
  productTitle: string;
  sku: string;
  ringSize: string | null;
  price: string;
  stockQuantity: number;
};

const fieldClass =
  "w-full border border-[var(--line)] bg-[var(--paper)] px-2 py-2 text-sm outline-none";

function VariantRowEditor({ row }: { row: InventoryRow }) {
  const [price, setPrice] = useState(row.price);
  const [stock, setStock] = useState(String(row.stockQuantity));
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d+$/.test(stock)) {
      setMessage("Enter a whole number for stock.");
      return;
    }

    setPending(true);
    setMessage("");
    const response = await fetch(`/api/admin/variants/${row.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        price: price.trim(),
        stock_quantity: Number(stock),
      }),
    });
    const data = (await response.json().catch(() => null)) as {
      message?: string;
      price?: string;
      stock_quantity?: number;
    } | null;
    setPending(false);

    if (!response.ok || !data?.price || typeof data.stock_quantity !== "number") {
      setMessage(data?.message ?? "Could not save this variant.");
      return;
    }

    setPrice(data.price);
    setStock(String(data.stock_quantity));
    setMessage("Saved");
  }

  return (
    <tr className="border-t border-[var(--line)] align-top">
      <td className="py-3 pr-4">
        <div className="font-semibold">{row.productTitle}</div>
        <div className="mt-1 text-xs tracking-[0.12em] text-[var(--muted)] uppercase">{row.sku}</div>
      </td>
      <td className="py-3 pr-4 text-sm">{row.ringSize ?? "—"}</td>
      <td className="py-3 pr-4">
        <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`price-${row.id}`}>
            Price in IRT for {row.sku}
          </label>
          <input
            id={`price-${row.id}`}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            inputMode="decimal"
            className={`${fieldClass} w-28`}
          />
          <label className="sr-only" htmlFor={`stock-${row.id}`}>
            Stock for {row.sku}
          </label>
          <input
            id={`stock-${row.id}`}
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            inputMode="numeric"
            className={`${fieldClass} w-20`}
          />
          <button
            type="submit"
            disabled={pending}
            className="border border-[var(--ink)] px-3 py-2 text-xs font-semibold tracking-[0.14em] uppercase disabled:opacity-50"
          >
            {pending ? "Saving" : "Save"}
          </button>
          {message ? <span className="text-xs text-[var(--muted)]">{message}</span> : null}
        </form>
      </td>
    </tr>
  );
}

export function InventoryTable({ rows }: { rows: InventoryRow[] }) {
  if (rows.length === 0) {
    return <p className="mt-6 text-sm text-[var(--muted)]">No variants are in the catalog yet.</p>;
  }

  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[640px] text-left">
        <thead>
          <tr className="text-xs font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
            <th className="pb-3 pr-4 font-semibold">Piece</th>
            <th className="pb-3 pr-4 font-semibold">Size</th>
            <th className="pb-3 font-semibold">Price IRT / Stock</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <VariantRowEditor key={row.id} row={row} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
