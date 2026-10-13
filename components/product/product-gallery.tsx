"use client";

import { useState } from "react";

type GalleryImage = {
  id: string;
  url: string;
  alt_text: string | null;
};

export function ProductGallery({ title, images }: { title: string; images: GalleryImage[] }) {
  const [index, setIndex] = useState(0);
  const current = images[index];

  return (
    <div className="bg-[#0a0a0a]">
      <div className="relative aspect-square overflow-hidden border-b border-white/15">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={current.alt_text ?? title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-8">
            <p className="text-center text-3xl font-bold tracking-[0.28em] text-white uppercase">
              {title}
            </p>
          </div>
        )}
      </div>
      {images.length > 0 ? (
        <div className="flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex gap-2">
            {images.map((image, imageIndex) => (
              <button
                key={image.id}
                type="button"
                aria-label={`Show image ${imageIndex + 1}`}
                aria-current={imageIndex === index}
                onClick={() => setIndex(imageIndex)}
                className={`h-2.5 w-2.5 rounded-full ${imageIndex === index ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {images.map((image, imageIndex) => (
              <button
                key={`${image.id}-thumb`}
                type="button"
                onClick={() => setIndex(imageIndex)}
                className={`h-14 w-14 shrink-0 border ${imageIndex === index ? "border-white" : "border-white/20"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
