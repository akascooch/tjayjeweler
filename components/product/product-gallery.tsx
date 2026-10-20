"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type GalleryImage = {
  id: string;
  url: string;
  alt_text: string | null;
};

type Point = { x: number; y: number };

const minScale = 1;
const maxScale = 4;

function clampScale(value: number) {
  return Math.min(maxScale, Math.max(minScale, value));
}

export function ProductGallery({ title, images }: { title: string; images: GalleryImage[] }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{ mode: "pinch" | "pan"; dist: number; scale: number; pan: Point; start: Point } | null>(
    null,
  );
  const current = images[index];

  function resetView() {
    setScale(1);
    setPan({ x: 0, y: 0 });
    gesture.current = null;
    pointers.current.clear();
  }

  function closeViewer() {
    setOpen(false);
    resetView();
  }

  function openViewer() {
    if (!current) return;
    resetView();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  function zoomBy(delta: number) {
    setScale((value) => {
      const next = clampScale(value + delta);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  }

  function onDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeViewer();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const items = [...dialogRef.current.querySelectorAll<HTMLElement>("button, [href], input")].filter(
      (item) => !item.hasAttribute("disabled"),
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size >= 2) {
      const [first, second] = [...pointers.current.values()];
      gesture.current = {
        mode: "pinch",
        dist: Math.hypot(first.x - second.x, first.y - second.y),
        scale,
        pan,
        start: { x: 0, y: 0 },
      };
      return;
    }
    gesture.current = { mode: "pan", dist: 0, scale, pan, start: { x: event.clientX, y: event.clientY } };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (gesture.current.mode === "pinch" && pointers.current.size >= 2) {
      const [first, second] = [...pointers.current.values()];
      const dist = Math.hypot(first.x - second.x, first.y - second.y);
      if (gesture.current.dist > 0) {
        setScale(clampScale(gesture.current.scale * (dist / gesture.current.dist)));
      }
      return;
    }
    if (gesture.current.mode === "pan" && scale > 1) {
      setPan({
        x: gesture.current.pan.x + (event.clientX - gesture.current.start.x),
        y: gesture.current.pan.y + (event.clientY - gesture.current.start.y),
      });
    }
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) gesture.current = null;
  }

  return (
    <div className="min-w-0 bg-[var(--paper)]">
      <div className="aspect-[4/5] overflow-hidden border-b border-[var(--line)] bg-[var(--surface)]">
        {current ? (
          <button
            ref={triggerRef}
            type="button"
            onClick={openViewer}
            aria-label={`Enlarge ${current.alt_text ?? title}`}
            className="block h-full w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.url} alt="" className="h-full w-full object-contain" />
          </button>
        ) : (
          <div className="flex h-full items-center justify-center px-8">
            <p className="text-center text-3xl font-medium tracking-[0.12em] uppercase">{title}</p>
          </div>
        )}
      </div>
      {images.length > 1 ? (
        <div className="flex min-w-0 items-center justify-between gap-4 px-4 py-4">
          <div className="flex shrink-0">
            {images.map((image, imageIndex) => (
              <button
                key={image.id}
                type="button"
                aria-label={`Show image ${imageIndex + 1}`}
                aria-current={imageIndex === index}
                onClick={() => setIndex(imageIndex)}
                className="flex h-11 w-8 items-center justify-center"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${imageIndex === index ? "bg-white" : "bg-white/50"}`} />
              </button>
            ))}
          </div>
          <div className="flex min-w-0 gap-2 overflow-x-auto">
            {images.map((image, imageIndex) => (
              <button
                key={`${image.id}-thumb`}
                type="button"
                aria-label={`Show image ${imageIndex + 1}`}
                onClick={() => setIndex(imageIndex)}
                className={`h-14 w-14 shrink-0 border bg-[var(--surface)] ${imageIndex === index ? "border-white" : "border-[var(--line-strong)]"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-full w-full object-contain" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {open && current ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Enlarged view of ${current.alt_text ?? title}`}
          className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]"
          onKeyDown={onDialogKeyDown}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
            <p className="font-ui min-w-0 truncate text-xs tracking-[0.16em] uppercase">{title}</p>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => zoomBy(-0.5)} aria-label="Zoom out" className="font-ui min-h-11 min-w-11 border border-[var(--line-strong)]">
                −
              </button>
              <button type="button" onClick={() => zoomBy(0.5)} aria-label="Zoom in" className="font-ui min-h-11 min-w-11 border border-[var(--line-strong)]">
                +
              </button>
              <button
                ref={closeRef}
                type="button"
                onClick={closeViewer}
                className="font-ui min-h-11 border border-white px-4 text-xs tracking-[0.16em] uppercase"
              >
                Close
              </button>
            </div>
          </div>
          <div
            className="relative min-h-0 flex-1 overflow-hidden"
            style={{ touchAction: "none" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.url}
              alt={current.alt_text ?? title}
              draggable={false}
              className="absolute top-1/2 left-1/2 max-h-full max-w-full object-contain select-none"
              style={{
                transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) scale(${scale})`,
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
