"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Header yang menempel di atas setelah halaman di-scroll (seperti Flatsome "stuck"):
 * tinggi 70px, lebar kotak 1140px, putih semi transparan dengan bayangan.
 */
export function StickyHeader({ children }: { children: React.ReactNode }) {
  const placeholder = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = placeholder.current;
      if (!el) return;
      // Menempel setelah header asli lewat dari layar
      setStuck(window.scrollY > el.offsetTop + el.offsetHeight + 60);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div ref={placeholder} className="h-[70px] md:h-[90px]">
      <div
        data-stuck={stuck}
        className={
          stuck
            ? "group fixed left-1/2 top-0 z-40 w-full max-w-[1140px] -translate-x-1/2 animate-[stuck-down_0.4s_ease] bg-white/90 shadow-[1px_1px_10px_rgba(0,0,0,0.15)] backdrop-blur-sm"
            : "group relative z-30 bg-white"
        }
      >
        {children}
      </div>
    </div>
  );
}
