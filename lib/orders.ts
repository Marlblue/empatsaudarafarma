import "server-only";
import { db } from "@/lib/db";
import { NEXT_STATUSES } from "@/lib/order-status";
import type { OrderStatus } from "@/generated/prisma/enums";

/**
 * Ubah status pesanan dengan validasi transisi. Pembatalan mengembalikan stok.
 * Mengembalikan false bila transisi tidak diizinkan.
 */
export async function changeOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  byUserId: string | null,
  note?: string,
) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || !NEXT_STATUSES[order.status].includes(toStatus)) return false;

    // Klaim transisi secara atomik agar pembatalan ganda tidak mengembalikan stok dua kali
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: { status: toStatus },
    });
    if (claimed.count === 0) return false;

    if (toStatus === "CANCELLED") {
      for (const item of order.items) {
        if (!item.productId) continue;
        await tx.product.updateMany({
          where: { id: item.productId, trackStock: true },
          data: { stock: { increment: item.quantity } },
        });
        await tx.product.updateMany({
          where: { id: item.productId, soldCount: { gte: item.quantity } },
          data: { soldCount: { decrement: item.quantity } },
        });
      }
    }
    await tx.orderStatusLog.create({
      data: { orderId, fromStatus: order.status, toStatus, byUserId, note },
    });
    return true;
  });
}

/** Batalkan pesanan transfer yang melewati batas waktu bayar. Dipanggil saat admin membuka dashboard/pesanan. */
export async function cancelExpiredOrders() {
  const expired = await db.order.findMany({
    where: { status: "PENDING_PAYMENT", paymentDueAt: { lt: new Date() } },
    select: { id: true },
    take: 100,
  });
  for (const o of expired) {
    await changeOrderStatus(o.id, "CANCELLED", null, "Dibatalkan otomatis: melewati batas waktu pembayaran");
  }
  return expired.length;
}
