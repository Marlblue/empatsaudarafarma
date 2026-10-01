import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setCustomerActive } from "@/app/admin/actions/misc";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { formatDateTime, formatRupiah, waLink } from "@/lib/format";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";
import { ResetPasswordButton } from "./reset-password";

export const metadata: Metadata = { title: "Detail Pelanggan" };

export default async function CustomerDetailPage({ params, searchParams }: PageProps<"/admin/pelanggan/[id]">) {
  await requireStaff();
  const { id } = await params;
  const customer = await db.user.findFirst({
    where: { id, role: "CUSTOMER" },
    include: {
      addresses: true,
      orders: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) notFound();
  const spent = customer.orders
    .filter((o) => ["PROCESSING", "SHIPPED", "COMPLETED"].includes(o.status))
    .reduce((n, o) => n + o.total, 0);

  return (
    <>
      <PageHeader title={customer.name} description={`Terdaftar ${formatDateTime(customer.createdAt)}`} back={{ href: "/admin/pelanggan", label: "Daftar pelanggan" }} />
      <Flash searchParams={await searchParams} />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="card overflow-hidden">
          <h2 className="border-b border-gray-100 px-4 py-3 font-bold text-gray-900">Riwayat Pesanan ({customer.orders.length})</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {customer.orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/pesanan/${o.id}`} className="font-semibold text-brand-700 hover:underline">{o.code}</Link>
                    <p className="text-xs text-gray-500">{formatDateTime(o.createdAt)}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ORDER_STATUS_COLOR[o.status]}`}>{ORDER_STATUS_LABEL[o.status]}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold">{formatRupiah(o.total)}</td>
                </tr>
              ))}
              {customer.orders.length === 0 && (
                <tr><td className="px-4 py-6 text-center text-gray-500">Belum ada pesanan.</td></tr>
              )}
            </tbody>
          </table>
        </section>
        <div className="space-y-6">
          <section className="card space-y-1 p-5 text-sm">
            <h2 className="mb-2 font-bold text-gray-900">Kontak</h2>
            <p>{customer.email}</p>
            <p>{customer.phone ?? "—"}</p>
            <p className="pt-2 text-gray-500">Total belanja: <strong className="text-gray-900">{formatRupiah(spent)}</strong></p>
            {customer.phone && (
              <a href={waLink(customer.phone, `Halo ${customer.name},`)} target="_blank" rel="noopener" className="btn-wa mt-3 w-full">
                WhatsApp
              </a>
            )}
          </section>
          <section className="card space-y-3 p-5">
            <h2 className="font-bold text-gray-900">Akun</h2>
            <p className="text-sm">
              Status: <strong className={customer.isActive ? "text-green-700" : "text-gray-500"}>{customer.isActive ? "Aktif" : "Nonaktif"}</strong>
            </p>
            <form action={setCustomerActive.bind(null, customer.id, !customer.isActive)}>
              {customer.isActive ? (
                <ConfirmButton message="Nonaktifkan akun ini? Pelanggan tidak bisa login." className="btn-outline w-full">Nonaktifkan Akun</ConfirmButton>
              ) : (
                <SubmitButton className="btn-outline w-full">Aktifkan Akun</SubmitButton>
              )}
            </form>
            <ResetPasswordButton userId={customer.id} />
          </section>
          <section className="card p-5 text-sm">
            <h2 className="mb-2 font-bold text-gray-900">Alamat Tersimpan</h2>
            {customer.addresses.map((a) => (
              <p key={a.id} className="border-b border-gray-100 py-2 last:border-0">
                <strong>{a.label}</strong> — {a.recipient}, {a.detail}, {a.city}, {a.province}
              </p>
            ))}
            {customer.addresses.length === 0 && <p className="text-gray-500">Tidak ada.</p>}
          </section>
        </div>
      </div>
    </>
  );
}
