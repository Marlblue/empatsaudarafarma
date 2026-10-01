import type { Metadata } from "next";
import { deleteSubscriber } from "@/app/admin/actions/misc";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { ConfirmButton } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Newsletter" };

export default async function NewsletterPage({ searchParams }: PageProps<"/admin/newsletter">) {
  await requireStaff();
  const subscribers = await db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader
        title="Newsletter"
        description={`${subscribers.length} email berlangganan`}
        actions={
          // eslint-disable-next-line @next/next/no-html-link-for-pages -- unduhan file dari route handler
          <a href="/admin/newsletter/export" className="btn-primary">Export CSV</a>
        }
      />
      <Flash searchParams={await searchParams} />
      <div className="card divide-y divide-gray-100">
        {subscribers.map((s) => (
          <div key={s.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
            <span>
              {s.email}
              <span className="ml-3 text-xs text-gray-400">{formatDateTime(s.createdAt)}</span>
            </span>
            <form action={deleteSubscriber.bind(null, s.id)}>
              <ConfirmButton message={`Hapus ${s.email}?`}>Hapus</ConfirmButton>
            </form>
          </div>
        ))}
        {subscribers.length === 0 && <p className="p-8 text-center text-gray-500">Belum ada pelanggan newsletter.</p>}
      </div>
    </>
  );
}
