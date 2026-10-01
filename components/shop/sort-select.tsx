"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value, options }: { value: string; options: Record<string, string> }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  return (
    <select
      value={value}
      aria-label="Urutkan produk"
      onChange={(e) => {
        const next = new URLSearchParams(params);
        next.set("sort", e.target.value);
        next.delete("page");
        router.push(`${pathname}?${next.toString()}`);
      }}
      className="h-[39px] border border-[#ddd] bg-white pl-3 pr-6 text-[15px] text-[#333] outline-none focus:border-sky"
    >
      {Object.entries(options).map(([k, label]) => (
        <option key={k} value={k}>
          {label}
        </option>
      ))}
    </select>
  );
}
