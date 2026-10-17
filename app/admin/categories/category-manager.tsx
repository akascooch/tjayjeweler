"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  product_count: number;
};

const fieldClass =
  "mt-2 w-full border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm outline-none";
const buttonClass =
  "border border-[var(--ink)] px-3 py-2 text-xs font-semibold tracking-[0.14em] uppercase";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, slug, description }),
    });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    setMessage(response.ok ? "Category created." : (data?.message ?? "Could not create the category."));
    if (response.ok) {
      setName("");
      setSlug("");
      setDescription("");
      router.refresh();
    }
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>, category: Category) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/categories/${category.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        slug: String(form.get("slug") ?? ""),
        description: String(form.get("description") ?? ""),
        sort_order: Number(form.get("sort_order") ?? 0),
      }),
    });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    setMessage(response.ok ? "Category saved." : (data?.message ?? "Could not save the category."));
    if (response.ok) router.refresh();
  }

  async function deleteCategory(id: string) {
    const response = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    setMessage(response.ok ? "Category deleted." : (data?.message ?? "Could not delete the category."));
    if (response.ok) router.refresh();
  }

  return (
    <div>
      <form onSubmit={createCategory} className="mt-8 grid max-w-3xl gap-3 md:grid-cols-3">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className={fieldClass} required />
        <input value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="slug" className={fieldClass} required />
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          className={fieldClass}
        />
        <button className={buttonClass} type="submit">
          Create category
        </button>
      </form>
      {message ? <p className="mt-4 text-sm text-[var(--muted)]">{message}</p> : null}
      <div className="mt-8 space-y-4">
        {categories.map((category) => (
          <form
            key={category.id}
            onSubmit={(event) => saveCategory(event, category)}
            className="grid gap-3 border border-[var(--line)] p-4 md:grid-cols-5"
          >
            <input name="name" defaultValue={category.name} aria-label="Name" className={fieldClass} />
            <input name="slug" defaultValue={category.slug} aria-label="Slug" className={fieldClass} />
            <input
              name="description"
              defaultValue={category.description ?? ""}
              aria-label="Description"
              className={fieldClass}
            />
            <input
              name="sort_order"
              defaultValue={category.sort_order}
              aria-label="Sort order"
              className={fieldClass}
            />
            <div className="flex gap-2">
              <button className={buttonClass} type="submit">
                Save
              </button>
              <button className={buttonClass} type="button" onClick={() => deleteCategory(category.id)}>
                Delete
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] md:col-span-5">{category.product_count} products</p>
          </form>
        ))}
      </div>
    </div>
  );
}
