import type { Metadata } from "next";
import Link from "next/link";
import { deleteCategory, saveCategory } from "@/app/admin/actions/categories";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Kategori" };

type Cat = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  parentId: string | null;
};

function CategoryFields({ category, parents }: { category?: Cat; parents: Cat[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="block">
        <span className="label">Nama</span>
        <input name="name" defaultValue={category?.name} required className="input" />
      </label>
      <label className="block">
        <span className="label">Slug (opsional)</span>
        <input name="slug" defaultValue={category?.slug} className="input" />
      </label>
      <label className="block">
        <span className="label">Induk</span>
        <select name="parentId" defaultValue={category?.parentId ?? ""} className="input">
          <option value="">— Kategori utama —</option>
          {parents
            .filter((p) => p.id !== category?.id)
            .map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
        </select>
      </label>
      <label className="block">
        <span className="label">Urutan tampil</span>
        <input name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 0} className="input" />
      </label>
      <label className="block md:col-span-2">
        <span className="label">Deskripsi (tampil di halaman kategori)</span>
        <textarea name="description" rows={2} defaultValue={category?.description ?? ""} className="input" />
      </label>
      <label className="block md:col-span-2">
        <span className="label">Gambar {category?.image && <span className="text-xs text-gray-400">(sudah ada; upload untuk mengganti)</span>}</span>
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className="block text-sm" />
      </label>
    </div>
  );
}

export default async function CategoriesPage({ searchParams }: PageProps<"/admin/kategori">) {
  await requireStaff();
  const all = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  const parents = all.filter((c) => !c.parentId);
  const ordered = parents.flatMap((p) => [p, ...all.filter((c) => c.parentId === p.id)]);

  return (
    <>
      <PageHeader title="Kategori" description={`${all.length} kategori`} />
      <Flash searchParams={await searchParams} />

      <details className="card mb-6 p-5">
        <summary className="cursor-pointer font-bold text-brand-700">+ Tambah Kategori</summary>
        <form action={saveCategory.bind(null, null)} className="mt-4 space-y-4">
          <CategoryFields parents={parents} />
          <SubmitButton>Simpan Kategori</SubmitButton>
        </form>
      </details>

      <div className="card divide-y divide-gray-100">
        {ordered.map((c) => (
          <details key={c.id} className="group">
            <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 ${c.parentId ? "pl-10" : ""}`}>
              <span>
                <span className={c.parentId ? "text-gray-700" : "font-semibold text-gray-900"}>
                  {c.parentId && "↳ "}
                  {c.name}
                </span>
                <span className="ml-2 text-xs text-gray-400">/{c.slug}</span>
              </span>
              <span className="flex items-center gap-4 text-sm">
                <Link href={`/admin/produk?kategori=${c.id}`} className="text-gray-500 hover:text-brand-700">
                  {c._count.products} produk
                </Link>
                <span className="font-semibold text-brand-700">Edit</span>
              </span>
            </summary>
            <div className="border-t border-gray-100 bg-gray-50 p-4">
              <form action={saveCategory.bind(null, c.id)} className="space-y-4">
                <CategoryFields category={c} parents={parents} />
                <SubmitButton>Simpan Perubahan</SubmitButton>
              </form>
              <form action={deleteCategory.bind(null, c.id)} className="mt-3">
                <ConfirmButton message={`Hapus kategori "${c.name}"?`}>Hapus kategori</ConfirmButton>
              </form>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
