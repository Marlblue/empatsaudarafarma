import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";
import { buildQuery, PageHeader, Pagination } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Pelanggan" };

const PER_PAGE = 25;

export default async function CustomersPage({ searchParams }: PageProps<"/admin/pelanggan">) {
  await requireStaff();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ],
    }),
  };
  const [total, customers] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { _count: { select: { orders: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader title="Pelanggan" description={`${total} pelanggan terdaftar`} />
      <form className="card mb-4 flex gap-3 p-4">
        <input name="q" defaultValue={q} placeholder="Cari nama, email, no. HP..." className="input" />
        <button className="btn-primary">Cari</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Nama</th>
              <th className="px-4 py-3">Kontak</th>
              <th className="px-4 py-3">Pesanan</th>
              <th className="px-4 py-3">Terdaftar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/pelanggan/${c.id}`} className="font-semibold text-brand-700 hover:underline">{c.name}</Link>
                  {!c.isActive && <span className="ml-2 rounded bg-gray-200 px-1.5 text-xs text-gray-600">Nonaktif</span>}
                </td>
                <td className="px-4 py-2.5">
                  {c.email}
                  <p className="text-xs text-gray-500">{c.phone}</p>
                </td>
                <td className="px-4 py-2.5">{c._count.orders}</td>
                <td className="px-4 py-2.5 text-gray-500">{formatDateTime(c.createdAt)}</td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-500">Belum ada pelanggan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={Math.max(1, Math.ceil(total / PER_PAGE))} href={(p) => buildQuery("/admin/pelanggan", { q, page: p })} />
    </>
  );
}
