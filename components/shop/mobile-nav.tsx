"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, MenuIcon } from "@/components/icons";

type Cat = { name: string; slug: string; children: { name: string; slug: string }[] };

/** Menu samping mobile ala Flatsome: panel putih 260px dari kiri, logo di atas, item kapital bergaris */
export function MobileNav({
  categories,
  logoUrl,
  storeName,
  account,
}: {
  categories: Cat[];
  logoUrl: string;
  storeName: string;
  account: { href: string; label: string };
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);

  // Tutup menu setelah pindah halaman
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const item =
    "block py-[15px] pl-5 pr-3 text-[12.8px] font-bold uppercase tracking-[0.02em] text-[#666]/85 hover:text-ink";
  const row = "border-t border-black/[0.08]";

  return (
    <div className="md:hidden">
      <button type="button" aria-label="Buka menu" aria-expanded={open} onClick={() => setOpen(true)} className="p-1 text-[#666]">
        <MenuIcon className="h-[26px] w-[26px]" />
      </button>
      {/* Portal ke <body>: header sticky memakai transform/backdrop-filter yang akan mengurung elemen fixed */}
      {open && createPortal(
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 animate-[fade-in_0.3s_ease] bg-[#0b0b0b]/80" onClick={() => setOpen(false)} />
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setOpen(false)}
            className="absolute right-0 top-0 z-10 flex h-10 w-10 items-center justify-center text-white/80 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.3} aria-hidden>
              <path d="M5 5l14 14M19 5 5 19" />
            </svg>
          </button>
          <aside className="relative h-full w-[260px] animate-[slide-in-left_0.3s_ease] overflow-y-auto bg-white py-[30px] shadow-xl">
            <Link href="/" className="block p-5">
              {logoUrl ? (
                <Image src={logoUrl} alt={storeName} width={220} height={44} unoptimized className="h-auto w-[220px]" />
              ) : (
                <span className="text-lg font-bold text-ink">{storeName}</span>
              )}
            </Link>
            <ul>
              <li className={row}>
                <Link href={account.href} className={item}>{account.label}</Link>
              </li>
              <li className={row}>
                <Link href="/tentang" className={item}>About Us</Link>
              </li>
              {categories.map((c) => {
                const isOpen = expanded === c.slug;
                return (
                  <li key={c.slug} className={`${row} ${isOpen ? "bg-black/[0.03]" : ""}`}>
                    {c.children.length > 0 ? (
                      <>
                        <div className="flex items-center">
                          <Link href={`/kategori/${c.slug}`} className={`${item} flex-1 ${isOpen ? "text-ink" : ""}`}>
                            {c.name}
                          </Link>
                          <button
                            type="button"
                            aria-label={`${isOpen ? "Tutup" : "Buka"} sub-menu ${c.name}`}
                            aria-expanded={isOpen}
                            onClick={() => setExpanded(isOpen ? null : c.slug)}
                            className="flex h-[50px] w-[50px] items-center justify-center text-[#666]"
                          >
                            <ChevronDown className={`h-5 w-5 transition ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                        {isOpen && (
                          <ul className="pb-4 pl-2">
                            {c.children.map((ch) => (
                              <li key={ch.slug}>
                                <Link href={`/kategori/${ch.slug}`} className="block py-[5px] pl-5 text-base text-[#666] hover:text-ink">
                                  {ch.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link href={`/kategori/${c.slug}`} className={item}>
                        {c.name}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </aside>
        </div>,
        document.body,
      )}
    </div>
  );
}
