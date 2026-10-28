"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export type CustomChoice = {
  id: string;
  title: string;
  slug: string;
  price: string;
  image: string | null;
  alt: string | null;
};

type Kind = "EXISTING_MODEL" | "ORIGINAL_DESIGN";

const steps = ["Type", "Piece", "Description", "Contact", "Review"] as const;

export function CustomRequestForm({ products }: { products: CustomChoice[] }) {
  const idempotencyKey = useRef(crypto.randomUUID());
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<Kind | "">("");
  const [productId, setProductId] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [receivedId, setReceivedId] = useState("");

  const selected = useMemo(
    () => products.find((product) => product.id === productId) ?? null,
    [productId, products],
  );

  function fail(message: string) {
    setError(message);
  }

  function nextStep(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (step === 0 && kind === "") {
      fail("Choose a request type.");
      return;
    }
    if (step === 1 && kind === "EXISTING_MODEL" && !selected) {
      fail("Choose a catalog piece to modify.");
      return;
    }
    if (step === 2 && description.trim().length < 20) {
      fail("Describe the request in at least 20 characters.");
      return;
    }
    if (step === 3) {
      if (!/^0\d{10}$/.test(phone.trim())) {
        fail("Enter a valid mobile number.");
        return;
      }
      if (file && file.size > MAX_IMAGE_BYTES) {
        fail("Images can be at most 15 MB.");
        return;
      }
    }
    setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);
    try {
      const body = new FormData();
      body.set("kind", kind);
      if (kind === "EXISTING_MODEL" && selected) body.set("product_id", selected.id);
      body.set("description", description.trim());
      body.set("contact_name", name.trim());
      body.set("contact_phone", phone.trim());
      if (file) body.set("file", file);
      const response = await fetch("/api/custom-requests", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey.current },
        body,
      });
      const payload = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
      if (!response.ok || !payload?.id) {
        fail(payload?.message ?? "The request could not be sent.");
        return;
      }
      setReceivedId(payload.id);
    } catch {
      fail("The request could not be sent.");
    } finally {
      setPending(false);
    }
  }

  if (receivedId) {
    return (
      <section className="border border-[var(--line)] bg-[var(--surface)] p-6" aria-live="polite">
        <h2 className="text-2xl font-medium tracking-[0.08em] uppercase">Request received</h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
          Reference {receivedId}. This is a request for review and quotation. It is not a confirmed order and it does
          not set a price.
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={step === steps.length - 1 ? submit : nextStep} className="min-w-0">
      <ol aria-label="Request steps" className="flex flex-wrap gap-2">
        {steps.map((label, index) => (
          <li key={label}>
            <span
              className={`font-ui inline-flex min-h-11 items-center px-3 text-xs tracking-[0.14em] uppercase ${
                index === step ? "border border-white text-white" : "text-[var(--muted)]"
              }`}
              aria-current={index === step ? "step" : undefined}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <fieldset className="mt-8">
          <legend className="text-sm tracking-[0.14em] uppercase">Request type</legend>
          <div className="mt-4 grid gap-3">
            <label className="flex min-h-11 items-start gap-3 border border-[var(--line-strong)] p-4">
              <input
                type="radio"
                name="kind"
                value="EXISTING_MODEL"
                checked={kind === "EXISTING_MODEL"}
                onChange={() => setKind("EXISTING_MODEL")}
              />
              <span>
                <span className="block text-sm">Modify a catalog piece</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">Start from a piece already in the gallery.</span>
              </span>
            </label>
            <label className="flex min-h-11 items-start gap-3 border border-[var(--line-strong)] p-4">
              <input
                type="radio"
                name="kind"
                value="ORIGINAL_DESIGN"
                checked={kind === "ORIGINAL_DESIGN"}
                onChange={() => {
                  setKind("ORIGINAL_DESIGN");
                  setProductId("");
                }}
              />
              <span>
                <span className="block text-sm">Request a new design</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">Describe an original piece.</span>
              </span>
            </label>
          </div>
        </fieldset>
      ) : null}

      {step === 1 ? (
        <fieldset className="mt-8">
          <legend className="text-sm tracking-[0.14em] uppercase">Catalog piece</legend>
          {kind === "ORIGINAL_DESIGN" ? (
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">No catalog piece is attached to a new design.</p>
          ) : products.length === 0 ? (
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">No catalog pieces are available to modify.</p>
          ) : (
            <div className="mt-4 grid gap-3">
              {products.map((product) => (
                <label key={product.id} className="flex min-h-11 items-center gap-3 border border-[var(--line-strong)] p-3">
                  <input
                    type="radio"
                    name="product"
                    value={product.id}
                    checked={productId === product.id}
                    onChange={() => setProductId(product.id)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm">{product.title}</span>
                    <span className="mt-1 block text-xs text-[var(--muted)]">{product.price}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </fieldset>
      ) : null}

      {step === 2 ? (
        <div className="mt-8">
          <label htmlFor="custom-description" className="text-sm tracking-[0.14em] uppercase">
            Description
          </label>
          <textarea
            id="custom-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            minLength={20}
            maxLength={2000}
            rows={6}
            className="mt-3 w-full min-w-0 border border-[var(--line-strong)] bg-[var(--paper)] p-3 text-sm leading-7"
          />
          <p className="mt-2 text-xs text-[var(--muted)]">{description.trim().length} / 2000</p>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-8 grid gap-4">
          <label className="block text-sm tracking-[0.14em] uppercase" htmlFor="custom-name">
            Name, optional
          </label>
          <input
            id="custom-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            autoComplete="name"
            className="min-h-11 w-full min-w-0 border border-[var(--line-strong)] bg-[var(--paper)] px-3"
          />
          <label className="block text-sm tracking-[0.14em] uppercase" htmlFor="custom-phone">
            Mobile number
          </label>
          <input
            id="custom-phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="numeric"
            autoComplete="tel"
            required
            className="min-h-11 w-full min-w-0 border border-[var(--line-strong)] bg-[var(--paper)] px-3"
          />
          <label className="block text-sm tracking-[0.14em] uppercase" htmlFor="custom-file">
            Reference image, optional
          </label>
          <input
            id="custom-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="block w-full min-w-0 text-sm"
          />
          <p className="text-xs leading-6 text-[var(--muted)]">JPEG, PNG, or WebP. 15 MB maximum. The studio re-encodes the file.</p>
        </div>
      ) : null}

      {step === 4 ? (
        <div className="mt-8 border border-[var(--line)] bg-[var(--surface)] p-5">
          <h2 className="text-xl font-medium tracking-[0.08em] uppercase">Review</h2>
          <dl className="mt-4 space-y-3 text-sm leading-7">
            <div>
              <dt className="text-[var(--muted)]">Type</dt>
              <dd>{kind === "EXISTING_MODEL" ? "Modify a catalog piece" : "New design"}</dd>
            </div>
            {selected ? (
              <div>
                <dt className="text-[var(--muted)]">Piece</dt>
                <dd>
                  <Link href={`/products/${selected.slug}`} className="underline">
                    {selected.title}
                  </Link>
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="text-[var(--muted)]">Description</dt>
              <dd className="whitespace-pre-wrap">{description.trim()}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Contact</dt>
              <dd>
                {name.trim() ? `${name.trim()} · ` : ""}
                {phone.trim()}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Reference image</dt>
              <dd>{file ? file.name : "None"}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Submitting sends a request for review and quotation. It does not confirm an order or a final price.
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-white" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => {
              setError("");
              setStep((value) => value - 1);
            }}
            className="font-ui min-h-11 border border-[var(--line-strong)] px-4 text-xs tracking-[0.14em] uppercase"
          >
            Back
          </button>
        ) : null}
        <button
          type="submit"
          disabled={pending || (step === 1 && kind === "EXISTING_MODEL" && products.length === 0)}
          className="font-ui min-h-11 border border-white bg-white px-4 text-xs tracking-[0.14em] text-black uppercase disabled:opacity-50"
        >
          {step === steps.length - 1 ? (pending ? "Sending" : "Submit request") : "Continue"}
        </button>
      </div>
    </form>
  );
}
