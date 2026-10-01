import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { formatDateTime, formatRupiah } from "@/lib/format";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { cancelExpiredOrders } from "@/lib/orders";
import { OrderStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { buildQuery, Flash, PageHeader, Pagination } from "@/components/admin/page-header";

export const metadata: Metadata = { title: "Pesanan" };

const PER_PAGE = 25;

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/pesanan">) {
  await requireStaff();
  await cancelExpiredOrders();
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const q = get("q")?.trim();
  const status = get("status");
  const method = get("metode");
  const from = get("dari");
  const to = get("sampai");
  const page = Math.max(1, Number(get("page")) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(status && status in OrderStatus && { status: status as OrderStatus }),
    ...((method === "TRANSFER" || method === "COD") && { paymentMethod: method }),
    ...(q && {
      OR: [
        { code: { contains: q, mode: "insensitive" } },
        { recipient: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...((from || to) && {
      createdAt: {
        ...(from && { gte: new Date(`${from}T00:00:00+07:00`) }),
        ...(to && { lte: new Date(`${to}T23:59:59+07:00`) }),
      },
    }),
  };

  const [total, orders, counts] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { _count: { select: { items: true } } },
    }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const countBy = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  const params = { q, status, metode: method, dari: from, sampai: to };

  return (
    <>
      <PageHeader title="Pesanan" description={`${total} pesanan`} />
      <Flash searchParams={sp} />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={buildQuery("/admin/pesanan", { ...params, status: undefined })}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${!status ? "bg-gray-900 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200"}`}
        >
          Semua
        </Link>
        {Object.values(OrderStatus).map((s) => (
          <Link
            key={s}
            href={buildQuery("/admin/pesanan", { ...params, status: s })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${status === s ? "bg-gray-900 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200"}`}
          >
            {ORDER_STATUS_LABEL[s]} <span className="text-xs opacity-70">({countBy[s] ?? 0})</span>
          </Link>
        ))}
      </div>

      <form className="card mb-4 grid gap-3 p-4 md:grid-cols-[1fr_auto_auto_auto_auto]">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="Cari kode, nama, no. HP, email..." className="input" />
        <select name="metode" defaultValue={method ?? ""} className="input">
          <option value="">Semua metode</option>
          <option value="TRANSFER">Transfer</option>
          <option value="COD">COD</option>
        </select>
        <input type="date" name="dari" defaultValue={from} aria-label="Dari tanggal" className="input" />
        <input type="date" name="sampai" defaultValue={to} aria-label="Sampai tanggal" className="input" />
        <button className="btn-primary">Filter</button>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Pesanan</th>
              <th className="px-4 py-3">Pelanggan</th>
              <th className="px-4 py-3">Metode</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/pesanan/${o.id}`} className="font-semibold text-brand-700 hover:underline">{o.code}</Link>
                  <p className="text-xs text-gray-500">{formatDateTime(o.createdAt)} · {o._count.items} produk</p>
                </td>
                <td className="px-4 py-2.5">
                  {o.recipient}
                  <p className="text-xs text-gray-500">{o.phone} · {o.city}</p>
                </td>
                <td className="px-4 py-2.5">{o.paymentMethod === "COD" ? "COD" : "Transfer"}</td>
                <td className="px-4 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ORDER_STATUS_COLOR[o.status]}`}>
                    {ORDER_STATUS_LABEL[o.status]}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-semibold">{formatRupiah(o.total)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">Tidak ada pesanan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(total / PER_PAGE))}
        href={(p) => buildQuery("/admin/pesanan", { ...params, page: p })}
      />
    </>
  );
}
