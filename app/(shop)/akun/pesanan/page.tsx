import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { OrderList } from "@/components/shop/order-list";

export const metadata: Metadata = { title: "Pesanan Saya", robots: { index: false } };

export default async function MyOrdersPage() {
  const user = await requireUser("/akun/pesanan");
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Pesanan Saya</h1>
      <OrderList orders={orders} />
    </div>
  );
}
