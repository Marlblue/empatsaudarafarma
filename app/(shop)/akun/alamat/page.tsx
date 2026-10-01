import type { Metadata } from "next";
import { deleteAddress } from "@/app/actions/account";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { AddressForm } from "./address-form";

export const metadata: Metadata = { title: "Alamat Saya", robots: { index: false } };

export default async function AddressesPage() {
  const user = await requireUser("/akun/alamat");
  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">Alamat Saya</h1>
      {addresses.map((a) => (
        <details key={a.id} className="card p-4">
          <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-2">
            <span className="text-sm">
              <span className="font-semibold text-gray-900">{a.label}</span>
              {a.isDefault && (
                <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-xs font-semibold text-brand-700">Utama</span>
              )}
              <span className="block text-gray-700">
                {a.recipient} · {a.phone}
              </span>
              <span className="block text-gray-500">
                {a.detail}, {a.district}, {a.city}, {a.province} {a.postalCode}
              </span>
            </span>
            <span className="text-sm font-semibold text-brand-700">Ubah</span>
          </summary>
          <div className="mt-4 border-t border-gray-100 pt-4">
            <AddressForm address={a} />
            <form action={deleteAddress.bind(null, a.id)} className="mt-3">
              <button className="text-sm text-red-600 hover:underline">Hapus alamat ini</button>
            </form>
          </div>
        </details>
      ))}
      <section className="card p-5">
        <h2 className="mb-4 font-bold text-brand-900">Tambah Alamat Baru</h2>
        <AddressForm />
      </section>
    </div>
  );
}
