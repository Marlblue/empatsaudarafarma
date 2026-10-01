import type { Metadata } from "next";
import Link from "next/link";
import { deleteReview, moderateReview } from "@/app/admin/actions/misc";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { buildQuery, Flash, PageHeader } from "@/components/admin/page-header";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Ulasan" };

const TABS = [
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Ditampilkan" },
  { value: "REJECTED", label: "Ditolak" },
] as const;

export default async function ReviewsPage({ searchParams }: PageProps<"/admin/ulasan">) {
  await requireStaff();
  const sp = await searchParams;
  const status = TABS.find((t) => t.value === sp.status)?.value ?? "PENDING";
  const reviews = await db.review.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { product: { select: { name: true, slug: true } }, user: { select: { name: true, email: true } } },
  });

  return (
    <>
      <PageHeader title="Ulasan Produk" />
      <Flash searchParams={sp} />
      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={buildQuery("/admin/ulasan", { status: t.value })}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${status === t.value ? "bg-gray-900 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="card p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-amber-400">
                  {"★".repeat(r.rating)}
                  <span className="text-gray-300">{"★".repeat(5 - r.rating)}</span>
                </p>
                <p className="font-semibold text-gray-900">
                  {r.user.name} <span className="font-normal text-gray-500">({r.user.email})</span>
                </p>
                <p className="text-xs text-gray-500">
                  {formatDateTime(r.createdAt)} ·{" "}
                  <Link href={`/produk/${r.product.slug}`} target="_blank" className="text-brand-700 hover:underline">{r.product.name}</Link>
                </p>
              </div>
              <div className="flex gap-2">
                {r.status !== "APPROVED" && (
                  <form action={moderateReview.bind(null, r.id, "APPROVED")}>
                    <SubmitButton className="btn bg-green-600 py-1.5 text-white hover:bg-green-700" pendingText="...">Tampilkan</SubmitButton>
                  </form>
                )}
                {r.status !== "REJECTED" && (
                  <form action={moderateReview.bind(null, r.id, "REJECTED")}>
                    <SubmitButton className="btn-outline py-1.5" pendingText="...">Tolak</SubmitButton>
                  </form>
                )}
                <form action={deleteReview.bind(null, r.id)}>
                  <ConfirmButton message="Hapus ulasan ini?" className="btn py-1.5 text-red-600 hover:bg-red-50">Hapus</ConfirmButton>
                </form>
              </div>
            </div>
            <p className="mt-2 text-gray-700">{r.comment}</p>
          </div>
        ))}
        {reviews.length === 0 && <p className="card p-8 text-center text-gray-500">Tidak ada ulasan.</p>}
      </div>
    </>
  );
}
