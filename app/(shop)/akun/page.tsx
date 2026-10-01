import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { OrderList } from "@/components/shop/order-list";

export const metadata: Metadata = { title: "Akun Saya", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUser();
  const [orders, pending, total] = await Promise.all([
    db.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { items: true } } },
    }),
    db.order.count({ where: { userId: user.id, status: "PENDING_PAYMENT" } }),
    db.order.count({ where: { userId: user.id } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Akun Saya</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total pesanan</p>
          <p className="text-2xl font-bold text-brand-900">{total}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Menunggu pembayaran</p>
          <p className="text-2xl font-bold text-amber-600">{pending}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Email</p>
          <p className="truncate font-semibold text-gray-900">{user.email}</p>
        </div>
      </div>
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-brand-900">Pesanan Terbaru</h2>
          <Link href="/akun/pesanan" className="text-sm font-semibold text-brand-700 hover:underline">Lihat semua</Link>
        </div>
        <OrderList orders={orders} />
      </div>
    </div>
  );
}
