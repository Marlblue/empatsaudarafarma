import type { Metadata } from "next";
import { createStaff, updateStaff } from "@/app/admin/actions/misc";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { SubmitButton } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Pengguna Admin" };

export default async function StaffPage({ searchParams }: PageProps<"/admin/pengguna">) {
  const me = await requireStaff({ adminOnly: true });
  const users = await db.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Pengguna Admin"
        description="Admin: akses penuh. Staf: produk, kategori, pesanan, pelanggan, ulasan, pesan & newsletter."
      />
      <Flash searchParams={await searchParams} />

      <details className="card mb-6 p-5">
        <summary className="cursor-pointer font-bold text-brand-700">+ Tambah Pengguna</summary>
        <form action={createStaff} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="block"><span className="label">Nama</span><input name="name" required className="input" /></label>
          <label className="block"><span className="label">Email</span><input name="email" type="email" required className="input" /></label>
          <label className="block">
            <span className="label">Peran</span>
            <select name="role" className="input" defaultValue="STAFF">
              <option value="STAFF">Staf</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <label className="block"><span className="label">Password awal</span><input name="password" type="password" minLength={8} required className="input" /></label>
          <div><SubmitButton>Tambah</SubmitButton></div>
        </form>
      </details>

      <div className="card divide-y divide-gray-100">
        {users.map((u) => (
          <details key={u.id} className="p-4">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm">
              <span>
                <strong className="text-gray-900">{u.name}</strong> <span className="text-gray-500">{u.email}</span>
                {u.id === me.id && <span className="ml-2 text-xs text-brand-700">(Anda)</span>}
              </span>
              <span className="flex items-center gap-3">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold">{u.role === "ADMIN" ? "Admin" : "Staf"}</span>
                {!u.isActive && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Nonaktif</span>}
                <span className="text-xs text-gray-400">sejak {formatDateTime(u.createdAt)}</span>
              </span>
            </summary>
            <form action={updateStaff.bind(null, u.id)} className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="block">
                <span className="label">Peran</span>
                <select name="role" defaultValue={u.role} className="input">
                  <option value="STAFF">Staf</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
              <label className="block">
                <span className="label">Password baru (opsional)</span>
                <input name="password" type="password" minLength={8} className="input" />
              </label>
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <input type="checkbox" name="isActive" defaultChecked={u.isActive} className="h-4 w-4 accent-brand-600" />
                Akun aktif
              </label>
              <div><SubmitButton>Simpan</SubmitButton></div>
            </form>
          </details>
        ))}
      </div>
    </>
  );
}
