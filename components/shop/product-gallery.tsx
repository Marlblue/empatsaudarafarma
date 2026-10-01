"use client";

import { useRef, useState } from "react";
import { ExpandIcon } from "@/components/icons";
import { ProductImage } from "@/components/product-image";

export function ProductGallery({ images, name }: { images: { url: string; alt: string | null }[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const lightbox = useRef<HTMLDialogElement>(null);
  const current = images[active];

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden bg-white"
        onMouseMove={(e) => {
          if (!current) return;
          const rect = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
        }}
        onMouseLeave={() => setZoom(null)}
        onClick={() => current && lightbox.current?.showModal()}
      >
        <div
          className="absolute inset-0 transition-transform duration-100"
          style={zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        >
          <ProductImage src={current?.url} alt={current?.alt ?? name} sizes="(min-width: 768px) 540px, 100vw" priority />
        </div>
        {current && (
          <span className="pointer-events-none absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#ddd] bg-white/80 text-[#bbb]">
            <ExpandIcon />
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Gambar ${i + 1}`}
              className={`relative h-20 w-20 shrink-0 overflow-hidden border-2 bg-white ${i === active ? "border-sky" : "border-transparent opacity-60 hover:opacity-100"}`}
            >
              <ProductImage src={img.url} alt={img.alt ?? name} sizes="80px" />
            </button>
          ))}
        </div>
      )}
      <dialog
        ref={lightbox}
        className="m-auto h-[90vh] w-[90vw] max-w-4xl bg-transparent p-0 backdrop:bg-black/90"
        onClick={() => lightbox.current?.close()}
      >
        <div className="relative h-full w-full">
          <ProductImage src={current?.url} alt={current?.alt ?? name} sizes="90vw" />
        </div>
      </dialog>
    </div>
  );
}
