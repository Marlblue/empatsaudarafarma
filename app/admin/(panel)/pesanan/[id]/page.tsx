import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  reviewPayment,
  saveInternalNote,
  saveShipping,
  updateOrderStatus,
} from "@/app/admin/actions/orders";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { formatDateTime, formatRupiah, waLink } from "@/lib/format";
import { NEXT_STATUSES, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Detail Pesanan" };

export default async function AdminOrderDetailPage({ params, searchParams }: PageProps<"/admin/pesanan/[id]">) {
  await requireStaff();
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { id: true, requiresPrescription: true } } } },
      paymentConfirmations: { orderBy: { createdAt: "desc" } },
      statusLogs: { orderBy: { createdAt: "desc" } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!order) notFound();

  const staffIds = [...new Set(order.statusLogs.map((l) => l.byUserId).filter(Boolean))] as string[];
  const staff = await db.user.findMany({ where: { id: { in: staffIds } }, select: { id: true, name: true } });
  const nameOf = (uid: string | null) => (uid ? (staff.find((s) => s.id === uid)?.name ?? "—") : "Sistem");

  const nextStatuses = NEXT_STATUSES[order.status];
  const needsPrescription = order.items.some((i) => i.product?.requiresPrescription);
  const waMessage = `Halo ${order.recipient}, pesanan ${order.code} Anda saat ini berstatus: ${ORDER_STATUS_LABEL[order.status]}.${
    order.trackingNumber ? ` No. resi ${order.courier}: ${order.trackingNumber}.` : ""
  }`;

  return (
    <>
      <PageHeader
        title={`Pesanan ${order.code}`}
        description={`Dibuat ${formatDateTime(order.createdAt)}`}
        back={{ href: "/admin/pesanan", label: "Daftar pesanan" }}
        actions={
          <>
            <a href={waLink(order.phone, waMessage)} target="_blank" rel="noopener" className="btn-wa">
              Hubungi via WhatsApp
            </a>
            <Link href={`/admin/pesanan/${order.id}/invoice`} target="_blank" className="btn-outline">
              Cetak Invoice
            </Link>
          </>
        }
      />
      <Flash searchParams={await searchParams} />

      {needsPrescription && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Pesanan ini berisi obat keras. Pastikan resep dokter sudah diterima sebelum pesanan dikirim.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Produk</h2>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${ORDER_STATUS_COLOR[order.status]}`}>
                {ORDER_STATUS_LABEL[order.status]}
              </span>
            </div>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2">
                      {i.product ? (
                        <Link href={`/admin/produk/${i.product.id}`} className="hover:text-brand-700">{i.productName}</Link>
                      ) : (
                        i.productName
                      )}
                      {i.product?.requiresPrescription && <span className="ml-2 text-xs font-semibold text-red-600">Resep</span>}
                    </td>
                    <td className="py-2 text-right text-gray-500">{i.quantity} × {formatRupiah(i.price)}</td>
                    <td className="w-32 py-2 text-right font-medium">{formatRupiah(i.price * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd>{formatRupiah(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Ongkir</dt><dd>{formatRupiah(order.shippingCost)}</dd></div>
              <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{formatRupiah(order.total)}</dd></div>
            </dl>
          </section>

          {order.paymentMethod === "TRANSFER" && (
            <section className="card p-5">
              <h2 className="mb-3 font-bold text-gray-900">Konfirmasi Pembayaran</h2>
              {order.paymentConfirmations.length === 0 && (
                <p className="text-sm text-gray-500">
                  Belum ada bukti transfer.
                  {order.paymentDueAt && ` Batas bayar ${formatDateTime(order.paymentDueAt)}.`}
                </p>
              )}
              <ul className="space-y-3">
                {order.paymentConfirmations.map((c) => (
                  <li key={c.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        <strong>{c.senderName}</strong> · {c.senderBank}
                        <span className="block text-xs text-gray-500">{formatDateTime(c.createdAt)}</span>
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          c.status === "APPROVED" ? "bg-green-100 text-green-700" : c.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {c.status === "APPROVED" ? "Disetujui" : c.status === "REJECTED" ? "Ditolak" : "Menunggu"}
                      </span>
                    </div>
                    <a href={c.proofUrl} target="_blank" rel="noopener" className="mt-2 inline-block font-semibold text-brand-700 hover:underline">
                      Lihat bukti transfer ↗
                    </a>
                    {c.status === "PENDING" && (
                      <div className="mt-3 flex gap-2">
                        <form action={reviewPayment.bind(null, c.id, true)}>
                          <SubmitButton className="btn bg-green-600 text-white hover:bg-green-700" pendingText="...">Setujui Pembayaran</SubmitButton>
                        </form>
                        <form action={reviewPayment.bind(null, c.id, false)}>
                          <ConfirmButton message="Tolak bukti pembayaran ini?" className="btn-outline">Tolak</ConfirmButton>
                        </form>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-5">
            <h2 className="mb-3 font-bold text-gray-900">Riwayat Status</h2>
            <ol className="space-y-3 border-l-2 border-gray-200 pl-4 text-sm">
              {order.statusLogs.map((l) => (
                <li key={l.id}>
                  <p className="font-semibold text-gray-900">{ORDER_STATUS_LABEL[l.toStatus]}</p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(l.createdAt)} · oleh {nameOf(l.byUserId)}
                  </p>
                  {l.note && <p className="text-gray-600">{l.note}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6">
          <section className="card space-y-1 p-5 text-sm">
            <h2 className="mb-2 font-bold text-gray-900">Pelanggan & Pengiriman</h2>
            <p className="font-semibold">{order.recipient}</p>
            <p>{order.phone}</p>
            <p>{order.email}</p>
            <p className="pt-2 text-gray-700">
              {order.addressDetail}
              <br />
              {order.district}, {order.city}
              <br />
              {order.province} {order.postalCode}
            </p>
            {order.note && <p className="pt-2 text-gray-500">Catatan pembeli: {order.note}</p>}
            <p className="pt-2 text-gray-500">Pembayaran: {order.paymentMethod === "COD" ? "COD" : "Transfer Bank"}</p>
            {order.user && (
              <Link href={`/admin/pelanggan/${order.user.id}`} className="inline-block pt-2 font-semibold text-brand-700 hover:underline">
                Lihat akun pelanggan
              </Link>
            )}
          </section>

          {nextStatuses.length > 0 && (
            <section className="card p-5">
              <h2 className="mb-3 font-bold text-gray-900">Ubah Status</h2>
              <form action={updateOrderStatus.bind(null, order.id)} className="space-y-3">
                <select name="status" className="input" required defaultValue="">
                  <option value="" disabled>Pilih status baru</option>
                  {nextStatuses.map((s) => (
                    <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
                  ))}
                </select>
                <input name="note" placeholder="Catatan (opsional)" className="input" />
                <SubmitButton className="btn-primary w-full">Simpan Status</SubmitButton>
              </form>
              <p className="mt-2 text-xs text-gray-500">Membatalkan pesanan akan mengembalikan stok produk.</p>
            </section>
          )}

          {["PROCESSING", "SHIPPED", "COMPLETED"].includes(order.status) && (
            <section className="card p-5">
              <h2 className="mb-3 font-bold text-gray-900">Pengiriman</h2>
              <form action={saveShipping.bind(null, order.id)} className="space-y-3">
                <input name="courier" defaultValue={order.courier ?? ""} placeholder="Kurir (mis. JNE REG)" className="input" required />
                <input name="trackingNumber" defaultValue={order.trackingNumber ?? ""} placeholder="No. resi" className="input" required />
                {order.trackingImage && (
                  <a href={order.trackingImage} target="_blank" rel="noopener" className="block">
                    {/* eslint-disable-next-line @next/next/no-img-element -- ukuran foto resi tidak diketahui */}
                    <img src={order.trackingImage} alt="Foto resi" className="max-h-48 rounded-lg border border-gray-200" />
                  </a>
                )}
                <label className="block">
                  <span className="label">{order.trackingImage ? "Ganti foto resi" : "Foto resi (opsional)"}</span>
                  <input
                    name="trackingImage"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:font-semibold file:text-brand-700"
                  />
                  <span className="mt-1 block text-xs text-gray-500">JPG, PNG, atau WEBP, maks. 5 MB. Bisa dilihat pembeli di halaman pesanannya.</span>
                </label>
                <SubmitButton className="btn-primary w-full">
                  {order.status === "PROCESSING" ? "Simpan & Tandai Dikirim" : "Simpan Resi"}
                </SubmitButton>
              </form>
            </section>
          )}

          <section className="card p-5">
            <h2 className="mb-3 font-bold text-gray-900">Catatan Internal</h2>
            <form action={saveInternalNote.bind(null, order.id)} className="space-y-3">
              <textarea name="internalNote" rows={3} defaultValue={order.internalNote ?? ""} className="input" placeholder="Hanya terlihat oleh admin" />
              <SubmitButton className="btn-outline w-full">Simpan Catatan</SubmitButton>
            </form>
          </section>
        </div>
      </div>
    </>
  );
}
