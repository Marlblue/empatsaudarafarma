import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isStaff, requireUser } from "@/lib/auth";
import { formatDateTime, formatRupiah, waLink } from "@/lib/format";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { getSettings } from "@/lib/settings";
import { ConfirmPaymentForm } from "./confirm-form";

export const metadata: Metadata = { title: "Detail Pesanan", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: PageProps<"/pesanan/[kode]">) {
  const { kode } = await params;
  const isNew = (await searchParams).baru === "1";
  const user = await requireUser(`/pesanan/${kode}`);
  const [order, settings] = await Promise.all([
    db.order.findUnique({
      where: { code: kode },
      include: {
        items: { include: { product: { select: { slug: true } } } },
        paymentConfirmations: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    getSettings(),
  ]);
  if (!order || (order.userId !== user.id && !isStaff(user.role))) notFound();

  const needsPayment =
    order.paymentMethod === "TRANSFER" && order.status === "PENDING_PAYMENT";
  const lastConfirmation = order.paymentConfirmations[0];

  return (
    <div className="container-page max-w-4xl py-8">
      {isNew && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="text-lg font-bold text-green-800">Terima kasih, pesanan Anda berhasil dibuat!</p>
          <p className="text-sm text-green-700">
            Kode pesanan <strong>{order.code}</strong>.{" "}
            {order.paymentMethod === "TRANSFER"
              ? "Silakan selesaikan pembayaran sesuai instruksi di bawah."
              : "Pesanan COD Anda akan segera kami proses."}
          </p>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Pesanan {order.code}</h1>
          <p className="text-sm text-gray-500">Dibuat {formatDateTime(order.createdAt)}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${ORDER_STATUS_COLOR[order.status]}`}>
          {ORDER_STATUS_LABEL[order.status]}
        </span>
      </div>

      {needsPayment && (
        <section className="card mb-6 space-y-4 border-brand-200 p-5">
          <h2 className="font-bold text-brand-900">Instruksi Pembayaran</h2>
          <p className="text-sm text-gray-700">
            Transfer sebesar <strong className="text-lg text-brand-700">{formatRupiah(order.total)}</strong> ke salah satu
            rekening berikut
            {order.paymentDueAt && (
              <>
                {" "}sebelum <strong>{formatDateTime(order.paymentDueAt)} WIB</strong>
              </>
            )}
            :
          </p>
          {settings.banks.length === 0 && (
            <p className="rounded-lg bg-brand-50 p-3 text-sm">
              Nomor rekening akan dikirim oleh CS kami. Silakan hubungi WhatsApp {settings.whatsapp}
              {settings.csName && ` (${settings.csName})`}.
            </p>
          )}
          <ul className="grid gap-2 sm:grid-cols-2">
            {settings.banks.map((b) => (
              <li key={b.bank + b.number} className="rounded-lg bg-brand-50 p-3 text-sm">
                <span className="font-bold text-brand-900">{b.bank}</span>
                <span className="block text-lg font-semibold tracking-wide">{b.number}</span>
                <span className="text-gray-600">a.n. {b.holder}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100 pt-4">
            <h3 className="mb-3 font-semibold text-gray-900">Konfirmasi Pembayaran</h3>
            <ConfirmPaymentForm code={order.code} />
          </div>
          <a
            href={waLink(settings.whatsapp, `Halo, saya sudah transfer untuk pesanan ${order.code} sebesar ${formatRupiah(order.total)}.`)}
            target="_blank"
            rel="noopener"
            className="btn-wa"
          >
            Konfirmasi via WhatsApp
          </a>
        </section>
      )}

      {order.status === "PENDING_VERIFICATION" && lastConfirmation && (
        <p className="mb-6 rounded-lg bg-orange-50 p-4 text-sm text-orange-800">
          Bukti transfer dari {lastConfirmation.senderName} ({lastConfirmation.senderBank}) sudah kami terima dan sedang diverifikasi.
        </p>
      )}

      {order.trackingNumber && (
        <p className="mb-6 rounded-lg bg-indigo-50 p-4 text-sm text-indigo-800">
          Dikirim via <strong>{order.courier}</strong> dengan no. resi <strong>{order.trackingNumber}</strong>
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-bold text-brand-900">Alamat Pengiriman</h2>
          <p className="text-sm text-gray-700">
            <strong>{order.recipient}</strong> · {order.phone}
            <br />
            {order.addressDetail}
            <br />
            {order.district}, {order.city}, {order.province} {order.postalCode}
          </p>
          {order.note && <p className="mt-2 text-sm text-gray-500">Catatan: {order.note}</p>}
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-bold text-brand-900">Pembayaran</h2>
          <p className="text-sm text-gray-700">
            {order.paymentMethod === "TRANSFER" ? "Transfer Bank" : "COD (Bayar di Tempat)"}
          </p>
        </section>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="mb-3 font-bold text-brand-900">Rincian Produk</h2>
        <ul className="divide-y divide-gray-100 text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-2">
              <span>
                {i.product ? (
                  <Link href={`/produk/${i.product.slug}`} className="hover:text-brand-700">{i.productName}</Link>
                ) : (
                  i.productName
                )}{" "}
                <span className="text-gray-400">
                  {i.quantity} × {formatRupiah(i.price)}
                </span>
              </span>
              <span className="font-medium">{formatRupiah(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd>{formatRupiah(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-600">Ongkos kirim</dt><dd>{order.shippingCost === 0 ? "Gratis" : formatRupiah(order.shippingCost)}</dd></div>
          <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd className="text-brand-700">{formatRupiah(order.total)}</dd></div>
        </dl>
      </section>

      <div className="mt-6 flex gap-3">
        <Link href="/akun/pesanan" className="btn-outline">Semua Pesanan Saya</Link>
        <Link href="/shop" className="btn-outline">Lanjut Belanja</Link>
      </div>
    </div>
  );
}
