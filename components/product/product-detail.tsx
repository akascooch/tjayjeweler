"use client";

import { Heart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProductGallery } from "@/components/product/product-gallery";
import { OUT_OF_STOCK, PRICE_ON_REQUEST, variantPriceCopy } from "@/lib/pricing";

type DetailVariant = {
  id: string;
  sku: string;
  price: string;
  stock_quantity: number;
  ring_size: string | null;
  chain_length: string | null;
  show_price_override: boolean | null;
};

type DetailImage = {
  id: string;
  url: string;
  alt_text: string | null;
};

export type ProductDetailData = {
  title: string;
  slug: string;
  description: string | null;
  purity: string;
  show_price: boolean;
  category: { name: string };
  variants: DetailVariant[];
  images: DetailImage[];
};

const bagKey = "tjay-bag";
const wishKey = "tjay-wishlist";

function chainLabel(chain: string) {
  if (chain === "50cm") return "Standard 50cm";
  if (chain === "60cm") return "Long 60cm";
  return `${chain} Chain`;
}

function readList(key: string) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function ProductDetail({ product }: { product: ProductDetailData }) {
  const chains = useMemo(() => {
    const values = product.variants
      .map((variant) => variant.chain_length)
      .filter((value): value is string => Boolean(value));
    return [...new Set(values)].sort((left, right) => parseInt(left, 10) - parseInt(right, 10));
  }, [product.variants]);
  const sizes = useMemo(() => {
    const values = product.variants
      .map((variant) => variant.ring_size)
      .filter((value): value is string => Boolean(value));
    return [...new Set(values)].sort();
  }, [product.variants]);

  const [chain, setChain] = useState(chains[0] ?? "");
  const [size, setSize] = useState(sizes[0] ?? "");
  const [expanded, setExpanded] = useState(false);
  const [wished, setWished] = useState(false);
  const [bagged, setBagged] = useState(false);
  const [note, setNote] = useState("");

  const selected =
    product.variants.find((variant) => {
      const chainMatches = chains.length === 0 || variant.chain_length === chain;
      const sizeMatches = sizes.length === 0 || variant.ring_size === size;
      return chainMatches && sizeMatches;
    }) ?? product.variants[0];

  useEffect(() => {
    if (!selected) return;
    setWished(readList(wishKey).includes(selected.sku));
    setBagged(readList(bagKey).includes(selected.sku));
    setNote("");
  }, [selected]);

  const description = product.description?.trim() ?? "";
  const collapsed = description.length > 220 && !expanded;
  const shown = collapsed ? `${description.slice(0, 220).trimEnd()}…` : description;
  const price = selected
    ? variantPriceCopy(product.show_price, selected.show_price_override, selected.price)
    : PRICE_ON_REQUEST;
  const unavailable = !selected || selected.stock_quantity === 0;

  function store(key: string, sku: string, present: boolean) {
    const next = readList(key).filter((item) => item !== sku);
    if (present) next.push(sku);
    localStorage.setItem(key, JSON.stringify(next));
  }

  function onBag() {
    if (!selected) return;
    if (selected.stock_quantity === 0) {
      setNote(OUT_OF_STOCK);
      return;
    }
    const next = !bagged;
    store(bagKey, selected.sku, next);
    setBagged(next);
    setNote(next ? "Added to bag" : "Removed from bag");
  }

  function onWish() {
    if (!selected) return;
    const next = !wished;
    store(wishKey, selected.sku, next);
    setWished(next);
    setNote(next ? "Saved to wishlist" : "Removed from wishlist");
  }

  return (
    <main className="bg-[var(--paper)] text-[var(--ink)]">
      <div className="lg:grid lg:grid-cols-2">
        <ProductGallery title={product.title} images={product.images} />
        <div className="px-6 py-10 md:px-12 md:py-14">
          <p className="font-ui text-xs font-semibold tracking-[0.32em] text-[var(--muted)] uppercase">
            {product.category.name}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-[0.14em] uppercase md:text-5xl">
            {product.title}
          </h1>
          <p className="mt-6 text-lg tracking-[0.18em] uppercase">{price}</p>
          {unavailable ? (
            <p className="mt-2 text-xs tracking-[0.22em] text-[var(--muted)] uppercase">{OUT_OF_STOCK}</p>
          ) : null}

          {chains.length > 0 ? (
            <fieldset className="mt-8">
              <legend className="text-xs font-semibold tracking-[0.22em] uppercase">
                Choose Chain Option
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {chains.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={option === chain}
                    onClick={() => setChain(option)}
                    className={`border px-4 py-2 text-xs font-semibold tracking-[0.16em] uppercase ${
                      option === chain ? "border-white bg-white text-black" : "border-[var(--line-strong)] text-white"
                    }`}
                  >
                    {chainLabel(option)}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {sizes.length > 0 ? (
            <fieldset className="mt-8">
              <legend className="text-xs font-semibold tracking-[0.22em] uppercase">Choose Size</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={option === size}
                    onClick={() => setSize(option)}
                    className={`border px-4 py-2 text-xs font-semibold tracking-[0.16em] uppercase ${
                      option === size ? "border-white bg-white text-black" : "border-[var(--line-strong)] text-white"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {description ? (
            <blockquote className="mt-8 border-l border-[var(--line-strong)] pl-4 text-sm leading-7 text-white/85 italic">
              {shown.split("\n").map((line, lineIndex) =>
                line.trim() ? (
                  <p key={lineIndex} dir="auto" className="whitespace-pre-wrap">
                    {line}
                  </p>
                ) : (
                  <br key={lineIndex} />
                ),
              )}
              {description.length > 220 ? (
                <button
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                  className="mt-4 text-xs font-semibold tracking-[0.22em] text-white uppercase not-italic"
                >
                  {expanded ? "Show less" : "Read more"}
                </button>
              ) : null}
            </blockquote>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onBag}
              className="border border-white bg-white px-6 py-3 text-xs font-bold tracking-[0.2em] text-black uppercase hover:bg-[var(--paper)] hover:text-white"
            >
              {bagged ? "In bag" : "Add to bag"}
            </button>
            <button
              type="button"
              onClick={onWish}
              className="inline-flex items-center gap-2 border border-white px-6 py-3 text-xs font-bold tracking-[0.2em] uppercase hover:bg-white hover:text-black"
            >
              <Heart size={16} fill={wished ? "currentColor" : "none"} aria-hidden />
              {wished ? "Wishlisted" : "Add to wishlist"}
            </button>
          </div>
          {note ? <p className="mt-4 text-xs tracking-[0.16em] text-white/70 uppercase">{note}</p> : null}
        </div>
      </div>
    </main>
  );
}
