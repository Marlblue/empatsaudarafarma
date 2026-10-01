import Link from "next/link";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/lib/order-status";
import type { OrderStatus } from "@/generated/prisma/enums";

export function OrderList({
  orders,
}: {
  orders: { id: string; code: string; status: OrderStatus; total: number; createdAt: Date; _count: { items: number } }[];
}) {
  if (orders.length === 0) {
    return (
      <div className="card p-8 text-center text-gray-600">
        Belum ada pesanan.{" "}
        <Link href="/shop" className="font-semibold text-brand-700 hover:underline">Mulai belanja</Link>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/pesanan/${o.code}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-gray-50">
            <div>
              <p className="font-semibold text-gray-900">{o.code}</p>
              <p className="text-xs text-gray-500">
                {formatDateTime(o.createdAt)} · {o._count.items} produk
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ORDER_STATUS_COLOR[o.status]}`}>
                {ORDER_STATUS_LABEL[o.status]}
              </span>
              <span className="font-bold text-brand-700">{formatRupiah(o.total)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
