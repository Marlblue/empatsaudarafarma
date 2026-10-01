import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { cancelExpiredOrders } from "@/lib/orders";
import { Flash, PageHeader } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({ searchParams }: PageProps<"/admin">) {
  await requireStaff();
  await cancelExpiredOrders();

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayOrders, pendingVerification, processing, revenue, outOfStock, lowStock, latest] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: startOfDay } } }),
    db.order.count({ where: { status: "PENDING_VERIFICATION" } }),
    db.order.count({ where: { status: "PROCESSING" } }),
    db.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: startOfMonth }, status: { in: ["PROCESSING", "SHIPPED", "COMPLETED"] } },
    }),
    db.product.count({ where: { trackStock: true, stock: 0, status: "PUBLISHED" } }),
    db.product.findMany({
      where: { trackStock: true, stock: { gt: 0, lte: 5 }, status: "PUBLISHED" },
      orderBy: { stock: "asc" },
      take: 8,
      select: { id: true, name: true, stock: true },
    }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const stats = [
    { label: "Pesanan hari ini", value: String(todayOrders), href: "/admin/pesanan" },
    { label: "Menunggu verifikasi", value: String(pendingVerification), href: "/admin/pesanan?status=PENDING_VERIFICATION", tone: "text-orange-600" },
    { label: "Perlu diproses", value: String(processing), href: "/admin/pesanan?status=PROCESSING", tone: "text-blue-600" },
    { label: "Omzet bulan ini", value: formatRupiah(revenue._sum.total ?? 0), href: "/admin/pesanan" },
    { label: "Produk stok habis", value: String(outOfStock), href: "/admin/produk?stok=habis", tone: "text-red-600" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" />
      <Flash searchParams={await searchParams} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-4 hover:border-brand-300">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.tone ?? "text-gray-900"}`}>{s.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="font-bold text-gray-900">Pesanan Terbaru</h2>
            <Link href="/admin/pesanan" className="text-sm font-semibold text-brand-700 hover:underline">Semua</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {latest.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/pesanan/${o.id}`} className="font-semibold text-brand-700 hover:underline">{o.code}</Link>
                      <p className="text-xs text-gray-500">{formatDateTime(o.createdAt)}</p>
                    </td>
                    <td className="px-4 py-2.5">{o.recipient}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ORDER_STATUS_COLOR[o.status]}`}>
                        {ORDER_STATUS_LABEL[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold">{formatRupiah(o.total)}</td>
                  </tr>
                ))}
                {latest.length === 0 && (
                  <tr><td className="px-4 py-6 text-center text-gray-500">Belum ada pesanan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card h-fit">
          <h2 className="border-b border-gray-100 px-4 py-3 font-bold text-gray-900">Stok Menipis</h2>
          <ul className="divide-y divide-gray-100 text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between gap-2 px-4 py-2">
                <Link href={`/admin/produk/${p.id}`} className="hover:text-brand-700">{p.name}</Link>
                <span className="font-semibold text-orange-600">{p.stock}</span>
              </li>
            ))}
            {lowStock.length === 0 && <li className="px-4 py-4 text-gray-500">Semua stok aman.</li>}
          </ul>
        </section>
      </div>
    </>
  );
}
