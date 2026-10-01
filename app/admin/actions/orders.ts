"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { changeOrderStatus } from "@/lib/orders";
import { OrderStatus } from "@/generated/prisma/enums";

function back(orderId: string, message: string, isError = false): never {
  revalidatePath(`/admin/pesanan/${orderId}`);
  redirect(`/admin/pesanan/${orderId}?${isError ? "error" : "ok"}=${encodeURIComponent(message)}`);
}

export async function updateOrderStatus(orderId: string, formData: FormData) {
  const user = await requireStaff();
  const toStatus = String(formData.get("status") ?? "") as OrderStatus;
  if (!(toStatus in OrderStatus)) back(orderId, "Status tidak valid", true);
  const note = String(formData.get("note") ?? "").trim() || undefined;
  const ok = await changeOrderStatus(orderId, toStatus, user.id, note);
  if (!ok) back(orderId, "Perubahan status tidak diizinkan dari status saat ini", true);
  back(orderId, "Status pesanan diperbarui");
}

export async function reviewPayment(confirmationId: string, approve: boolean) {
  const user = await requireStaff();
  const confirmation = await db.paymentConfirmation.findUnique({ where: { id: confirmationId } });
  if (!confirmation) redirect("/admin/pesanan");
  const orderId = confirmation.orderId;
  if (confirmation.status !== "PENDING") back(orderId, "Konfirmasi ini sudah diproses", true);

  const changed = await changeOrderStatus(
    orderId,
    approve ? "PROCESSING" : "PENDING_PAYMENT",
    user.id,
    approve ? "Pembayaran disetujui" : "Bukti pembayaran ditolak",
  );
  if (!changed) back(orderId, "Status pesanan saat ini tidak memungkinkan verifikasi pembayaran", true);
  await db.paymentConfirmation.update({
    where: { id: confirmationId },
    data: { status: approve ? "APPROVED" : "REJECTED", reviewedBy: user.id },
  });
  back(orderId, approve ? "Pembayaran disetujui, pesanan diproses" : "Pembayaran ditolak, pelanggan diminta upload ulang");
}

export async function saveShipping(orderId: string, formData: FormData) {
  const user = await requireStaff();
  const courier = String(formData.get("courier") ?? "").trim().slice(0, 50);
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim().slice(0, 100);
  if (!courier || !trackingNumber) back(orderId, "Isi kurir dan nomor resi", true);

  const order = await db.order.update({ where: { id: orderId }, data: { courier, trackingNumber } });
  if (order.status === "PROCESSING") {
    await changeOrderStatus(orderId, "SHIPPED", user.id, `Dikirim via ${courier} (${trackingNumber})`);
  }
  back(orderId, "Data pengiriman tersimpan");
}

export async function saveInternalNote(orderId: string, formData: FormData) {
  await requireStaff();
  const internalNote = String(formData.get("internalNote") ?? "").trim().slice(0, 2000) || null;
  await db.order.update({ where: { id: orderId }, data: { internalNote } });
  back(orderId, "Catatan tersimpan");
}
