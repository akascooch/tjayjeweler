"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type ProductListItem = {
  id: string;
  title: string;
  slug: string;
  is_visible: boolean;
  show_price: boolean;
  status: string;
  category_id: string;
  category: { name: string };
  variants: { sku: string; stock_quantity: number }[];
};

const buttonClass =
  "border border-[var(--line)] px-3 py-2 text-xs font-semibold tracking-[0.14em] uppercase";

export function ProductList({
  products,
  categories,
}: {
  products: ProductListItem[];
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(products);
  const [visibleOnly, setVisibleOnly] = useState(false);
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setRows(products);
  }, [products]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((product) => {
      if (visibleOnly && !product.is_visible) return false;
      if (categoryId !== "all" && product.category_id !== categoryId) return false;
      if (!query) return true;
      return (
        product.title.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query) ||
        product.variants.some((variant) => variant.sku.toLowerCase().includes(query))
      );
    });
  }, [rows, visibleOnly, categoryId, search]);

  async function patch(id: string, body: { is_visible?: boolean; show_price?: boolean }) {
    setMessage("");
    const response = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    if (!response.ok) {
      setMessage(data?.message ?? "Could not update the product.");
      return;
    }
    setRows((current) =>
      current.map((product) => (product.id === id ? { ...product, ...body } : product)),
    );
    router.refresh();
  }

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <label className="text-xs font-semibold tracking-[0.16em] uppercase">
          Search
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mt-2 block border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm font-normal tracking-normal normal-case"
          />
        </label>
        <label className="text-xs font-semibold tracking-[0.16em] uppercase">
          Category
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="mt-2 block border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm font-normal tracking-normal normal-case"
          >
            <option value="all">All</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-xs font-semibold tracking-[0.16em] uppercase">
          <input
            type="checkbox"
            checked={visibleOnly}
            onChange={(event) => setVisibleOnly(event.target.checked)}
          />
          Visible only
        </label>
        <Link href="/admin/products/new" className={`${buttonClass} border-[var(--ink)]`}>
          New product
        </Link>
      </div>
      {message ? <p className="mt-4 text-sm text-[var(--muted)]">{message}</p> : null}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="text-xs tracking-[0.16em] text-[var(--muted)] uppercase">
              <th className="pb-3 font-semibold">Piece</th>
              <th className="pb-3 font-semibold">Visible</th>
              <th className="pb-3 font-semibold">Price</th>
              <th className="pb-3 font-semibold">Manage</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-t border-[var(--line)]">
                <td className="py-3 pr-4">
                  <div className="font-semibold">{product.title}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {product.category.name} · {product.status}
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <input
                    type="checkbox"
                    checked={product.is_visible}
                    aria-label={`Visible ${product.title}`}
                    onChange={(event) => patch(product.id, { is_visible: event.target.checked })}
                  />
                </td>
                <td className="py-3 pr-4">
                  <input
                    type="checkbox"
                    checked={product.show_price}
                    aria-label={`Show price ${product.title}`}
                    onChange={(event) => patch(product.id, { show_price: event.target.checked })}
                  />
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/products/${product.id}`} className={buttonClass}>
                      Edit
                    </Link>
                    <Link href={`/admin/products/${product.id}#variants`} className={buttonClass}>
                      Variants
                    </Link>
                    <Link href={`/admin/products/${product.id}#images`} className={buttonClass}>
                      Images
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">No products match these filters.</p>
        ) : null}
      </div>
    </div>
  );
}
