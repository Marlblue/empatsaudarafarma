import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { getSettings } from "@/lib/settings";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Invoice" };

// Di luar layout panel agar halaman cetak bersih (tanpa sidebar)
export default async function InvoicePage({ params }: PageProps<"/admin/pesanan/[id]/invoice">) {
  await requireStaff();
  const { id } = await params;
  const [order, s] = await Promise.all([
    db.order.findUnique({ where: { id }, include: { items: true } }),
    getSettings(),
  ]);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-sm text-gray-900 print:p-0">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <header className="flex items-start justify-between border-b pb-4">
        <div>
          <p className="text-xl font-extrabold text-brand-800">{s.storeName}</p>
          <p className="max-w-xs text-gray-600">{s.address}</p>
          <p className="text-gray-600">WA {s.whatsapp}{s.email && ` · ${s.email}`}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">INVOICE</p>
          <p className="font-mono">{order.code}</p>
          <p className="text-gray-600">{formatDateTime(order.createdAt)}</p>
          <p className="text-gray-600">{ORDER_STATUS_LABEL[order.status]}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-6 py-4">
        <div>
          <p className="font-semibold text-gray-500">Kirim ke</p>
          <p className="font-semibold">{order.recipient}</p>
          <p>{order.phone}</p>
          <p>{order.addressDetail}</p>
          <p>{order.district}, {order.city}, {order.province} {order.postalCode}</p>
        </div>
        <div>
          <p className="font-semibold text-gray-500">Pembayaran</p>
          <p>{order.paymentMethod === "COD" ? "COD (Bayar di Tempat)" : "Transfer Bank"}</p>
          {order.trackingNumber && (
            <>
              <p className="mt-2 font-semibold text-gray-500">Pengiriman</p>
              <p>{order.courier} · {order.trackingNumber}</p>
            </>
          )}
        </div>
      </section>

      <table className="w-full border-t">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Produk</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Harga</th>
            <th className="py-2 text-right">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id} className="border-b">
              <td className="py-2">{i.productName}</td>
              <td className="py-2 text-right">{i.quantity}</td>
              <td className="py-2 text-right">{formatRupiah(i.price)}</td>
              <td className="py-2 text-right">{formatRupiah(i.price * i.quantity)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={3} className="pt-3 text-right">Subtotal</td><td className="pt-3 text-right">{formatRupiah(order.subtotal)}</td></tr>
          <tr><td colSpan={3} className="text-right">Ongkos kirim</td><td className="text-right">{formatRupiah(order.shippingCost)}</td></tr>
          <tr className="text-base font-bold"><td colSpan={3} className="pt-1 text-right">Total</td><td className="pt-1 text-right">{formatRupiah(order.total)}</td></tr>
        </tfoot>
      </table>
      {order.note && <p className="mt-6 text-gray-600">Catatan: {order.note}</p>}
      <p className="mt-10 text-center text-xs text-gray-500">Terima kasih telah berbelanja di {s.storeName}. {s.licenseInfo}</p>
    </div>
  );
}
