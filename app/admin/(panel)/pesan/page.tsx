import type { Metadata } from "next";
import { deleteMessage, toggleMessageRead } from "@/app/admin/actions/misc";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { formatDateTime, waLink } from "@/lib/format";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Pesan Kontak" };

export default async function MessagesPage({ searchParams }: PageProps<"/admin/pesan">) {
  await requireStaff();
  const messages = await db.contactMessage.findMany({ orderBy: [{ isRead: "asc" }, { createdAt: "desc" }], take: 200 });

  return (
    <>
      <PageHeader title="Pesan Kontak" description="Pesan dari formulir halaman Kontak" />
      <Flash searchParams={await searchParams} />
      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`card p-4 text-sm ${m.isRead ? "opacity-70" : "border-brand-200"}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">
                  {!m.isRead && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand-600" />}
                  {m.name}
                </p>
                <p className="text-xs text-gray-500">
                  <a href={`mailto:${m.email}`} className="hover:underline">{m.email}</a>
                  {m.phone && <> · <a href={waLink(m.phone, `Halo ${m.name},`)} target="_blank" rel="noopener" className="hover:underline">{m.phone}</a></>}
                  {" · "}
                  {formatDateTime(m.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={toggleMessageRead.bind(null, m.id, !m.isRead)}>
                  <SubmitButton className="btn-outline py-1.5" pendingText="...">
                    {m.isRead ? "Tandai belum dibaca" : "Tandai sudah dibaca"}
                  </SubmitButton>
                </form>
                <form action={deleteMessage.bind(null, m.id)}>
                  <ConfirmButton message="Hapus pesan ini?" className="btn py-1.5 text-red-600 hover:bg-red-50">Hapus</ConfirmButton>
                </form>
              </div>
            </div>
            <p className="mt-2 whitespace-pre-line text-gray-700">{m.message}</p>
          </div>
        ))}
        {messages.length === 0 && <p className="card p-8 text-center text-gray-500">Belum ada pesan.</p>}
      </div>
    </>
  );
}
