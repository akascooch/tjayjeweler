"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type CategoryOption = { id: string; name: string };

const fieldClass =
  "mt-2 w-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none";
const labelClass = "block text-xs font-semibold tracking-[0.16em] uppercase";
const buttonClass =
  "border border-[var(--ink)] px-3 py-2 text-xs font-semibold tracking-[0.14em] uppercase disabled:opacity-50";

export function NewProductForm({ categories }: { categories: CategoryOption[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const response = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        slug,
        category_id: categoryId,
        description,
        status: "ACTIVE",
        is_visible: true,
        show_price: true,
      }),
    });
    const data = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
    setPending(false);
    if (!response.ok || !data?.id) {
      setMessage(data?.message ?? "Could not create the product.");
      return;
    }
    router.push(`/admin/products/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 max-w-xl space-y-4">
      <label className={labelClass}>
        Name
        <input value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} required />
      </label>
      <label className={labelClass}>
        Slug
        <input value={slug} onChange={(event) => setSlug(event.target.value)} className={fieldClass} required />
      </label>
      <label className={labelClass}>
        Category
        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className={fieldClass}
          required
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <label className={labelClass}>
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={`${fieldClass} min-h-28`}
        />
      </label>
      {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
      <button type="submit" disabled={pending || categories.length === 0} className={buttonClass}>
        {pending ? "Creating" : "Create product"}
      </button>
    </form>
  );
}
