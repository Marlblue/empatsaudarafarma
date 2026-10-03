"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { cartSummary, getCart } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { canCustomerCancel } from "@/lib/order-status";
import { changeOrderStatus } from "@/lib/orders";
import { calculateShipping, PROVINCES } from "@/lib/shipping";
import { isUploadedFile, saveUpload } from "@/lib/storage";

export type CheckoutState = { error?: string; fieldErrors?: Record<string, string[]> } | null;

const checkoutSchema = z.object({
  recipient: z.string().trim().min(2, "Nama penerima wajib diisi").max(100),
  phone: z.string().trim().regex(/^[0-9+\-\s]{8,20}$/, "Nomor HP tidak valid"),
  province: z.enum(PROVINCES as [string, ...string[]], { message: "Pilih provinsi" }),
  city: z.string().trim().min(2, "Kota wajib diisi").max(100),
  district: z.string().trim().min(2, "Kecamatan wajib diisi").max(100),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Kode pos 5 digit"),
  addressDetail: z.string().trim().min(5, "Alamat lengkap wajib diisi").max(500),
  note: z.string().trim().max(500).optional(),
  paymentMethod: z.enum(["TRANSFER", "COD"], { message: "Pilih metode pembayaran" }),
  saveAddress: z.string().optional(),
});

function orderCode() {
  const d = new Date(Date.now() + 7 * 3600_000); // WIB
  const date = d.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `AF-${date}-${rand}`;
}

class StockError extends Error {}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const user = await requireUser("/checkout");
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const data = parsed.data;

  const [settings, cart, rates] = await Promise.all([getSettings(), getCart(), db.shippingRate.findMany()]);
  const { items, subtotal } = cartSummary(cart);
  if (!cart || items.length === 0) return { error: "Keranjang Anda kosong." };
  if (data.paymentMethod === "COD" && !settings.codEnabled) {
    return { error: "Pembayaran COD sedang tidak tersedia." };
  }

  const shippingCost = calculateShipping(data.province, data.city, subtotal, {
    rates,
    flatShippingCost: settings.flatShippingCost,
    freeShippingMin: settings.freeShippingMin,
  });

  let code: string;
  try {
    code = await db.$transaction(async (tx) => {
      // Kurangi stok secara atomik; gagal bila stok tidak cukup
      for (const item of items) {
        if (!item.product.trackStock) continue;
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new StockError(`Stok ${item.product.name} tidak mencukupi. Silakan ubah jumlah di keranjang.`);
        }
      }
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { soldCount: { increment: item.quantity } },
        });
      }

      const code = orderCode();
      const isCod = data.paymentMethod === "COD";
      const initialStatus = isCod ? "PROCESSING" : "PENDING_PAYMENT";
      await tx.order.create({
        data: {
          code,
          userId: user.id,
          email: user.email,
          status: initialStatus,
          paymentMethod: data.paymentMethod,
          subtotal,
          shippingCost,
          total: subtotal + shippingCost,
          recipient: data.recipient,
          phone: data.phone,
          province: data.province,
          city: data.city,
          district: data.district,
          postalCode: data.postalCode,
          addressDetail: data.addressDetail,
          note: data.note || null,
          paymentDueAt: isCod ? null : new Date(Date.now() + settings.paymentDueHours * 3600_000),
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              productName: i.product.name,
              price: i.product.price,
              quantity: i.quantity,
            })),
          },
          statusLogs: { create: { toStatus: initialStatus, byUserId: user.id, note: "Pesanan dibuat" } },
        },
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      if (data.saveAddress === "on") {
        const hasAddress = await tx.address.count({ where: { userId: user.id } });
        await tx.address.create({
          data: {
            userId: user.id,
            recipient: data.recipient,
            phone: data.phone,
            province: data.province,
            city: data.city,
            district: data.district,
            postalCode: data.postalCode,
            detail: data.addressDetail,
            isDefault: hasAddress === 0,
          },
        });
      }
      return code;
    });
  } catch (e) {
    if (e instanceof StockError) return { error: e.message };
    throw e;
  }

  revalidatePath("/", "layout");
  redirect(`/pesanan/${code}?baru=1`);
}

export type ConfirmState = { ok: boolean; message: string } | null;

const confirmSchema = z.object({
  senderName: z.string().trim().min(2, "Nama pengirim wajib diisi").max(100),
  senderBank: z.string().trim().min(2, "Bank asal wajib diisi").max(50),
});

export async function confirmPayment(code: string, _prev: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const user = await requireUser(`/pesanan/${code}`);
  const order = await db.order.findUnique({ where: { code } });
  if (!order || order.userId !== user.id) return { ok: false, message: "Pesanan tidak ditemukan." };
  if (order.paymentMethod !== "TRANSFER" || !["PENDING_PAYMENT", "PENDING_VERIFICATION"].includes(order.status)) {
    return { ok: false, message: "Pesanan ini tidak memerlukan konfirmasi pembayaran." };
  }

  const parsed = confirmSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  const proof = formData.get("proof");
  if (!isUploadedFile(proof)) return { ok: false, message: "Upload bukti transfer." };

  let proofUrl: string;
  try {
    proofUrl = await saveUpload(proof, "proofs", "proof");
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  await db.$transaction([
    db.paymentConfirmation.create({ data: { orderId: order.id, proofUrl, ...parsed.data } }),
    db.order.update({ where: { id: order.id }, data: { status: "PENDING_VERIFICATION" } }),
    db.orderStatusLog.create({
      data: {
        orderId: order.id,
        fromStatus: order.status,
        toStatus: "PENDING_VERIFICATION",
        byUserId: user.id,
        note: "Pelanggan mengunggah bukti transfer",
      },
    }),
  ]);
  revalidatePath(`/pesanan/${code}`);
  return { ok: true, message: "Bukti transfer terkirim. Admin akan memverifikasi pembayaran Anda." };
}

export type CancelState = { ok: boolean; message: string } | null;

export async function cancelOrder(code: string, _prev: CancelState, formData: FormData): Promise<CancelState> {
  const user = await requireUser(`/pesanan/${code}`);
  const order = await db.order.findUnique({ where: { code } });
  if (!order || order.userId !== user.id) return { ok: false, message: "Pesanan tidak ditemukan." };
  if (!canCustomerCancel(order)) {
    return { ok: false, message: "Pesanan sudah diproses dan tidak bisa dibatalkan. Silakan hubungi CS kami." };
  }

  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300);
  const cancelled = await changeOrderStatus(
    order.id,
    "CANCELLED",
    user.id,
    reason ? `Dibatalkan oleh pembeli: ${reason}` : "Dibatalkan oleh pembeli",
  );
  if (!cancelled) return { ok: false, message: "Status pesanan baru saja berubah. Muat ulang halaman ini." };

  revalidatePath(`/pesanan/${code}`);
  revalidatePath("/akun/pesanan");
  return { ok: true, message: "Pesanan berhasil dibatalkan." };
}
