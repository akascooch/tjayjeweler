"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type CategoryOption = { id: string; name: string };

type Variant = {
  id: string;
  sku: string;
  price: string;
  stock_quantity: number;
  weight_grams: string;
  ring_size: string | null;
  show_price_override: boolean | null;
};

type Image = {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
};

export type EditorProduct = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  purity: string;
  base_weight: string;
  is_visible: boolean;
  show_price: boolean;
  sort_order: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  category_id: string;
  variants: Variant[];
  images: Image[];
};

const fieldClass =
  "mt-2 w-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-sm outline-none";
const labelClass = "block text-xs font-semibold tracking-[0.16em] uppercase";
const buttonClass =
  "border border-[var(--ink)] px-3 py-2 text-xs font-semibold tracking-[0.14em] uppercase disabled:opacity-50";

async function send(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await response.json().catch(() => null)) as { message?: string } | null;
  return { ok: response.ok, status: response.status, data };
}

export function ProductEditor({
  product,
  categories,
}: {
  product: EditorProduct;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(product.title);
  const [slug, setSlug] = useState(product.slug);
  const [description, setDescription] = useState(product.description ?? "");
  const [categoryId, setCategoryId] = useState(product.category_id);
  const [status, setStatus] = useState(product.status);
  const [sortOrder, setSortOrder] = useState(String(product.sort_order));
  const [purity, setPurity] = useState(product.purity);
  const [baseWeight, setBaseWeight] = useState(product.base_weight);
  const [isVisible, setIsVisible] = useState(product.is_visible);
  const [showPrice, setShowPrice] = useState(product.show_price);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d+$/.test(sortOrder)) {
      setMessage("Sort order must be a whole number.");
      return;
    }
    setPending(true);
    setMessage("");
    const result = await send(`/api/admin/products/${product.id}`, "PATCH", {
      title,
      slug,
      description,
      category_id: categoryId,
      status,
      sort_order: Number(sortOrder),
      purity,
      base_weight: baseWeight,
      is_visible: isVisible,
      show_price: showPrice,
    });
    setPending(false);
    setMessage(result.ok ? "Product saved." : (result.data?.message ?? "Could not save the product."));
    if (result.ok) router.refresh();
  }

  async function archiveProduct() {
    setPending(true);
    const result = await send(`/api/admin/products/${product.id}`, "DELETE");
    setPending(false);
    setMessage(result.data?.message ?? (result.ok ? "Product archived." : "Could not archive the product."));
    if (result.ok) {
      setIsVisible(false);
      setStatus("ARCHIVED");
      router.refresh();
    }
  }

  return (
    <div className="space-y-12">
      <form onSubmit={saveProduct} className="grid max-w-3xl gap-4 md:grid-cols-2">
        <label className={labelClass}>
          Name
          <input value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} required />
        </label>
        <label className={labelClass}>
          Slug
          <input value={slug} onChange={(event) => setSlug(event.target.value)} className={fieldClass} required />
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={`${fieldClass} min-h-28`}
          />
        </label>
        <label className={labelClass}>
          Category
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className={fieldClass}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as EditorProduct["status"])}
            className={fieldClass}
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label className={labelClass}>
          Sort order
          <input value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Purity
          <input value={purity} onChange={(event) => setPurity(event.target.value)} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Base weight g
          <input value={baseWeight} onChange={(event) => setBaseWeight(event.target.value)} className={fieldClass} />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase">
          <input type="checkbox" checked={isVisible} onChange={(event) => setIsVisible(event.target.checked)} />
          Visible
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] uppercase">
          <input type="checkbox" checked={showPrice} onChange={(event) => setShowPrice(event.target.checked)} />
          Show price
        </label>
        <div className="flex flex-wrap gap-3 md:col-span-2">
          <button type="submit" disabled={pending} className={buttonClass}>
            {pending ? "Saving" : "Save product"}
          </button>
          <button type="button" disabled={pending} onClick={archiveProduct} className={buttonClass}>
            Archive
          </button>
        </div>
        {message ? <p className="text-sm text-[var(--muted)] md:col-span-2">{message}</p> : null}
      </form>
      <VariantManager productId={product.id} variants={product.variants} />
      <ImageManager productId={product.id} images={product.images} />
    </div>
  );
}

function VariantManager({ productId, variants }: { productId: string; variants: Variant[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("0.00");
  const [stock, setStock] = useState("0");
  const [weight, setWeight] = useState("0.000");

  async function saveVariant(event: FormEvent<HTMLFormElement>, variant: Variant) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const stockValue = String(form.get("stock") ?? "");
    if (!/^\d+$/.test(stockValue)) {
      setMessage("Stock must be a whole number.");
      return;
    }
    const override = String(form.get("override") ?? "inherit");
    const result = await send(`/api/admin/variants/${variant.id}`, "PATCH", {
      sku: String(form.get("sku") ?? ""),
      price: String(form.get("price") ?? ""),
      stock_quantity: Number(stockValue),
      weight_grams: String(form.get("weight") ?? "0"),
      show_price_override: override === "inherit" ? null : override === "show",
    });
    setMessage(result.ok ? "Variant saved." : (result.data?.message ?? "Could not save the variant."));
    if (result.ok) router.refresh();
  }

  async function removeVariant(id: string) {
    const result = await send(`/api/admin/variants/${id}`, "DELETE");
    setMessage(result.ok ? "Variant deleted." : (result.data?.message ?? "Could not delete the variant."));
    if (result.ok) router.refresh();
  }

  async function addVariant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d+$/.test(stock)) {
      setMessage("Stock must be a whole number.");
      return;
    }
    const result = await send(`/api/admin/products/${productId}/variants`, "POST", {
      sku,
      price,
      stock_quantity: Number(stock),
      weight_grams: weight,
    });
    setMessage(result.ok ? "Variant added." : (result.data?.message ?? "Could not add the variant."));
    if (result.ok) {
      setSku("");
      router.refresh();
    }
  }

  return (
    <section id="variants">
      <h3 className="text-xl font-black tracking-[0.12em] uppercase">Variants</h3>
      <div className="mt-4 space-y-4">
        {variants.map((variant) => (
          <form
            key={variant.id}
            onSubmit={(event) => saveVariant(event, variant)}
            className="grid gap-3 border border-[var(--line)] p-4 md:grid-cols-6"
          >
            <input name="sku" defaultValue={variant.sku} aria-label="SKU" className={fieldClass} />
            <input name="price" defaultValue={variant.price} aria-label="Price" className={fieldClass} />
            <input name="stock" defaultValue={variant.stock_quantity} aria-label="Stock" className={fieldClass} />
            <input name="weight" defaultValue={variant.weight_grams} aria-label="Weight grams" className={fieldClass} />
            <select
              name="override"
              defaultValue={
                variant.show_price_override === null ? "inherit" : variant.show_price_override ? "show" : "hide"
              }
              aria-label="Price visibility"
              className={fieldClass}
            >
              <option value="inherit">Inherit</option>
              <option value="show">Show</option>
              <option value="hide">Hide</option>
            </select>
            <div className="flex gap-2">
              <button className={buttonClass} type="submit">
                Save
              </button>
              <button className={buttonClass} type="button" onClick={() => removeVariant(variant.id)}>
                Delete
              </button>
            </div>
          </form>
        ))}
      </div>
      <form onSubmit={addVariant} className="mt-4 grid gap-3 md:grid-cols-5">
        <input value={sku} onChange={(event) => setSku(event.target.value)} placeholder="SKU" className={fieldClass} />
        <input value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Price" className={fieldClass} />
        <input value={stock} onChange={(event) => setStock(event.target.value)} placeholder="Stock" className={fieldClass} />
        <input value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Weight g" className={fieldClass} />
        <button className={buttonClass} type="submit">
          Add variant
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-[var(--muted)]">{message}</p> : null}
    </section>
  );
}

function ImageManager({ productId, images }: { productId: string; images: Image[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [message, setMessage] = useState("");

  async function addImage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await send(`/api/admin/products/${productId}/images`, "POST", {
      url,
      alt_text: alt,
      is_primary: images.length === 0,
      sort_order: images.length,
    });
    setMessage(result.ok ? "Image added." : (result.data?.message ?? "Could not add the image."));
    if (result.ok) {
      setUrl("");
      setAlt("");
      router.refresh();
    }
  }

  async function makePrimary(id: string) {
    const result = await send(`/api/admin/images/${id}`, "PATCH", { is_primary: true });
    setMessage(result.ok ? "Primary image updated." : (result.data?.message ?? "Could not update the image."));
    if (result.ok) router.refresh();
  }

  async function removeImage(id: string) {
    const result = await send(`/api/admin/images/${id}`, "DELETE");
    setMessage(result.ok ? "Image deleted." : (result.data?.message ?? "Could not delete the image."));
    if (result.ok) router.refresh();
  }

  return (
    <section id="images">
      <h3 className="text-xl font-black tracking-[0.12em] uppercase">Images</h3>
      <ul className="mt-4 space-y-3">
        {images.map((image) => (
          <li key={image.id} className="flex flex-wrap items-center justify-between gap-3 border border-[var(--line)] p-3">
            <span className="max-w-xl truncate text-sm">
              {image.is_primary ? "Primary · " : ""}
              {image.url}
            </span>
            <span className="flex gap-2">
              {image.is_primary ? null : (
                <button type="button" className={buttonClass} onClick={() => makePrimary(image.id)}>
                  Make primary
                </button>
              )}
              <button type="button" className={buttonClass} onClick={() => removeImage(image.id)}>
                Delete
              </button>
            </span>
          </li>
        ))}
      </ul>
      <form onSubmit={addImage} className="mt-4 grid gap-3 md:grid-cols-[1fr_16rem_auto]">
        <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https:// image URL" className={fieldClass} required />
        <input value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="Alt text" className={fieldClass} />
        <button className={buttonClass} type="submit">
          Add image
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-[var(--muted)]">{message}</p> : null}
    </section>
  );
}
