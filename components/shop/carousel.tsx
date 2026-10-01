"use client";

import { Children, useCallback, useEffect, useRef, useState } from "react";

/** Slider sederhana ala Smart Slider: geser otomatis, bisa di-swipe/drag, panah tipis di kiri/kanan */
export function Carousel({ children, interval = 6000 }: { children: React.ReactNode; interval?: number }) {
  const slides = Children.toArray(children);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Geser jari/mouse yang sedang berlangsung (px); null bila tidak sedang drag
  const [dragX, setDragX] = useState<number | null>(null);
  const drag = useRef<{ startX: number; startY: number; id: number; horizontal: boolean | null; moved: boolean } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  // Setelah swipe, klik yang menyusul tidak boleh membuka link di slide
  const suppressClick = useRef(false);
  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused || dragX !== null) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(timer);
  }, [count, paused, interval, dragX, index]);

  function onPointerDown(e: React.PointerEvent) {
    if (count < 2 || (e.pointerType === "mouse" && e.button !== 0)) return;
    suppressClick.current = false;
    drag.current = { startX: e.clientX, startY: e.clientY, id: e.pointerId, horizontal: null, moved: false };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    // Tentukan arah setelah jari bergerak sedikit: vertikal = biarkan halaman scroll
    if (d.horizontal === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      d.horizontal = Math.abs(dx) > Math.abs(dy);
      if (!d.horizontal) {
        drag.current = null;
        return;
      }
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    d.moved = true;
    suppressClick.current = true;
    setDragX(dx);
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId || !d.moved) return setDragX(null);
    const width = rootRef.current?.clientWidth ?? 1;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > Math.min(60, width * 0.15)) go(index + (dx < 0 ? 1 : -1));
    setDragX(null);
  }

  function onClickCapture(e: React.MouseEvent) {
    if (!suppressClick.current) return;
    e.preventDefault();
    e.stopPropagation();
    suppressClick.current = false;
  }

  const offset = dragX !== null ? `calc(-${index * 100}% + ${dragX}px)` : `-${index * 100}%`;

  return (
    <div
      ref={rootRef}
      className="relative touch-pan-y select-none overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClickCapture={onClickCapture}
      onDragStart={(e) => e.preventDefault()}
      aria-roledescription="carousel"
    >
      <div
        className={`flex ${dragX !== null ? "" : "transition-transform duration-700 ease-out"}`}
        style={{ transform: `translateX(${offset})` }}
      >
        {slides.map((slide, i) => (
          <div key={i} className="w-full shrink-0" aria-hidden={i !== index} inert={i !== index}>
            {slide}
          </div>
        ))}
      </div>
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Slide sebelumnya"
            onClick={() => go(index - 1)}
            className="absolute left-2 top-1/2 max-md:hidden -translate-y-1/2 p-2 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] hover:scale-110 md:left-4"
          >
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="m15 4-8 8 8 8" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Slide berikutnya"
            onClick={() => go(index + 1)}
            className="absolute right-2 top-1/2 max-md:hidden -translate-y-1/2 p-2 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] hover:scale-110 md:right-4"
          >
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="m9 4 8 8-8 8" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
