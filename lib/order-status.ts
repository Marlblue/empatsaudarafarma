import type { OrderStatus } from "@/generated/prisma/enums";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Menunggu Pembayaran",
  PENDING_VERIFICATION: "Menunggu Verifikasi",
  PROCESSING: "Diproses",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-800",
  PENDING_VERIFICATION: "bg-orange-100 text-orange-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

/** Transisi status yang diizinkan dari panel admin */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PENDING_VERIFICATION", "PROCESSING", "CANCELLED"],
  PENDING_VERIFICATION: ["PROCESSING", "PENDING_PAYMENT", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};
