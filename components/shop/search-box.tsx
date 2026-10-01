"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { formatRupiah } from "@/lib/format";
import { SearchIcon } from "@/components/icons";
import { ProductImage } from "@/components/product-image";

type Suggestion = { name: string; slug: string; price: number; image: string | null };

export function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const listId = useId();

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        .then((r) => r.json())
        .then(setResults)
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  const showList = open && q.trim().length >= 2 && results.length > 0;

  return (
    <form
      role="search"
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        setOpen(false);
        router.push(`/cari?q=${encodeURIComponent(q.trim())}`);
      }}
    >
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Pencarian..."
        aria-label="Cari produk"
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={showList}
        className="h-[33px] w-full rounded-full border border-black/10 bg-black/[0.03] pl-3 pr-9 text-[13px] text-[#555] outline-none placeholder:text-[#777] focus:border-black/20 focus:bg-white"
      />
      <button type="submit" aria-label="Cari" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555] hover:text-ink">
        <SearchIcon className="h-[17px] w-[17px]" />
      </button>
      {showList && (
        <ul
          id={listId}
          className="absolute inset-x-0 top-full z-40 mt-1 overflow-hidden border border-line bg-white shadow-lg"
        >
          {results.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/produk/${r.slug}`}
                className="flex items-center gap-3 px-3 py-2 hover:bg-sky-soft"
                onClick={() => setOpen(false)}
              >
                <span className="relative h-10 w-10 shrink-0 overflow-hidden bg-white">
                  <ProductImage src={r.image} alt={r.name} sizes="40px" />
                </span>
                <span className="flex-1 text-[13px] text-[#333]">{r.name}</span>
                <span className="text-[13px] font-bold text-price">{formatRupiah(r.price)}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={`/cari?q=${encodeURIComponent(q.trim())}`}
              className="block bg-[#f9f9f9] px-3 py-2 text-center text-[13px] font-bold uppercase text-ink hover:bg-sky-soft"
            >
              Lihat semua hasil
            </Link>
          </li>
        </ul>
      )}
    </form>
  );
}
