"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type NavItem = { href: string; label: string; badge?: number };

export function AdminSidebar({ items, storeName }: { items: NavItem[]; storeName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  const nav = (
    <nav className="space-y-0.5 p-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium ${
            isActive(item.href) ? "bg-brand-600 text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          {item.label}
          {!!item.badge && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">{item.badge}</span>
          )}
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      <div className="flex items-center justify-between bg-gray-900 px-4 py-3 text-white lg:hidden">
        <span className="font-bold">{storeName}</span>
        <button type="button" aria-label="Menu admin" onClick={() => setOpen((o) => !o)} className="rounded p-1 hover:bg-white/10">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {open && <div className="bg-gray-900 lg:hidden">{nav}</div>}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto bg-gray-900 lg:block">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">Admin Panel</p>
          <p className="font-bold text-white">{storeName}</p>
        </div>
        {nav}
      </aside>
    </>
  );
}
