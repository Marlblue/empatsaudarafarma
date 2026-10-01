import Link from "next/link";
import { adminLogout } from "@/app/actions/auth";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { AdminSidebar, type NavItem } from "@/components/admin/sidebar";

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireStaff();
  const [settings, pendingVerification, newOrders, pendingReviews, unreadMessages] = await Promise.all([
    getSettings(),
    db.order.count({ where: { status: "PENDING_VERIFICATION" } }),
    db.order.count({ where: { status: "PROCESSING" } }),
    db.review.count({ where: { status: "PENDING" } }),
    db.contactMessage.count({ where: { isRead: false } }),
  ]);

  const items: NavItem[] = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/produk", label: "Produk" },
    { href: "/admin/kategori", label: "Kategori" },
    { href: "/admin/pesanan", label: "Pesanan", badge: pendingVerification + newOrders },
    { href: "/admin/pelanggan", label: "Pelanggan" },
    { href: "/admin/ulasan", label: "Ulasan", badge: pendingReviews },
    { href: "/admin/pesan", label: "Pesan Kontak", badge: unreadMessages },
    { href: "/admin/newsletter", label: "Newsletter" },
    ...(user.role === "ADMIN"
      ? [
          { href: "/admin/banner", label: "Banner" },
          { href: "/admin/pengaturan", label: "Pengaturan Toko" },
          { href: "/admin/pengguna", label: "Pengguna Admin" },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar items={items} storeName={settings.storeName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 border-b border-gray-200 bg-white px-6 py-3 text-sm">
          <Link href="/" target="_blank" className="text-brand-700 hover:underline">
            Lihat Toko ↗
          </Link>
          <span className="text-gray-600">
            {user.name} <span className="text-xs text-gray-400">({user.role === "ADMIN" ? "Admin" : "Staf"})</span>
          </span>
          <form action={adminLogout}>
            <button className="font-semibold text-red-600 hover:underline">Keluar</button>
          </form>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
