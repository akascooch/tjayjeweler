"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export type ProductSlide = {
  slug: string;
  title: string;
  imageUrl: string | null;
  imageAlt: string;
};

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function ProductScroller({ products }: { products: ProductSlide[] }) {
  const scrollerId = useId();
  const headingId = useId();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(products.length > 1);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function update() {
      const node = scrollerRef.current;
      if (!node) return;
      const max = node.scrollWidth - node.clientWidth;
      setCanPrev(node.scrollLeft > 2);
      setCanNext(max > 2 && node.scrollLeft < max - 2);
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [products]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function onWheel(event: WheelEvent) {
      const node = scrollerRef.current;
      if (!node || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const max = node.scrollWidth - node.clientWidth;
      if (max <= 2) return;
      const atStart = node.scrollLeft <= 0 && event.deltaY < 0;
      const atEnd = node.scrollLeft >= max - 1 && event.deltaY > 0;
      if (atStart || atEnd) return;
      node.scrollLeft = Math.min(max, Math.max(0, node.scrollLeft + event.deltaY));
      event.preventDefault();
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [products]);

  function scrollByCard(direction: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    const slide = el.querySelector<HTMLElement>("[data-slide]");
    const gap = Number.parseFloat(window.getComputedStyle(el).columnGap || "0") || 0;
    const distance = (slide?.offsetWidth ?? el.clientWidth * 0.7) + gap;
    el.scrollBy({ left: direction * distance, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollByCard(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollByCard(-1);
    }
  }

  return (
    <section aria-labelledby={headingId} className="min-w-0 border border-[var(--line)]">
      <div className="flex items-center justify-between gap-3 px-4 py-4">
        <h1 id={headingId} className="font-ui text-xs tracking-[0.2em] text-[var(--muted)] uppercase">
          Product photos
        </h1>
        {products.length > 1 ? (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={!canPrev}
              aria-controls={scrollerId}
              aria-label="Previous photo"
              className="inline-flex h-11 w-11 items-center justify-center border border-[var(--line-strong)] disabled:opacity-40"
            >
              <ChevronLeft size={18} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={!canNext}
              aria-controls={scrollerId}
              aria-label="Next photo"
              className="inline-flex h-11 w-11 items-center justify-center border border-[var(--line-strong)] disabled:opacity-40"
            >
              <ChevronRight size={18} aria-hidden />
            </button>
          </div>
        ) : null}
      </div>
      {products.length === 0 ? (
        <p className="px-4 pb-8 text-sm text-[var(--muted)]">No pieces are listed yet.</p>
      ) : (
        <div
          ref={scrollerRef}
          id={scrollerId}
          tabIndex={0}
          role="region"
          aria-label="Product photos"
          onKeyDown={onKeyDown}
          className="flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-4"
        >
          {products.map((product, index) => {
            const alt = product.imageAlt.trim();
            const imageAlt = alt.localeCompare(product.title.trim(), undefined, { sensitivity: "accent" }) === 0 ? "" : alt;
            return (
              <Link
                key={product.slug}
                href={`/products/${product.slug}`}
                data-slide
                className="block w-[min(72vw,15rem)] shrink-0 snap-start border border-[var(--line)] bg-[var(--paper)] sm:w-60"
              >
                {product.imageUrl ? (
                  <span className="block aspect-[4/5] bg-[var(--paper)]">
                    {/* Catalog URLs can come from the media route, so they stay outside the image optimizer. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrl}
                      alt={imageAlt}
                      loading={index < 2 ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={index === 0 ? "high" : "low"}
                      className="h-full w-full object-contain"
                    />
                  </span>
                ) : (
                  <span className="flex aspect-[4/5] items-center justify-center bg-[var(--paper)] px-4 text-center text-sm tracking-[0.12em] uppercase">
                    {product.title}
                  </span>
                )}
                {product.imageUrl ? (
                  <span className="block truncate px-3 py-3 text-xs tracking-[0.12em] uppercase">{product.title}</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
