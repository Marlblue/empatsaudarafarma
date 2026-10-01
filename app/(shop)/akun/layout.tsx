import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth";

const LINKS = [
  { href: "/akun", label: "Ringkasan" },
  { href: "/akun/pesanan", label: "Pesanan Saya" },
  { href: "/akun/alamat", label: "Alamat" },
  { href: "/akun/profil", label: "Profil & Password" },
];

export default async function AccountLayout({ children }: LayoutProps<"/akun">) {
  const user = await requireUser();
  return (
    <div className="container-page grid gap-8 py-8 md:grid-cols-[220px_1fr]">
      <aside className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">Halo,</p>
          <p className="font-bold text-brand-900">{user.name}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700">
              {l.label}
            </Link>
          ))}
          <form action={logout}>
            <button className="w-full shrink-0 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">
              Keluar
            </button>
          </form>
        </nav>
      </aside>
      <div>{children}</div>
    </div>
  );
}
