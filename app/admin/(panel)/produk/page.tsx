import type { Metadata } from "next";
import Link from "next/link";
import { bulkProductAction, quickUpdateProduct } from "@/app/admin/actions/products";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { formatRupiah } from "@/lib/format";
import type { Prisma } from "@/generated/prisma/client";
import { buildQuery, Flash, PageHeader, Pagination } from "@/components/admin/page-header";
import { SelectAll } from "@/components/admin/select-all";
import { BulkSubmit, SubmitButton } from "@/components/admin/ui";
import { ProductImage } from "@/components/product-image";

export const metadata: Metadata = { title: "Produk" };

const PER_PAGE = 20;

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/produk">) {
  await requireStaff();
  const sp = await searchParams;
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const q = get("q")?.trim();
  const category = get("kategori");
  const status = get("status");
  const stok = get("stok");
  const sort = get("sort") ?? "updated";
  const page = Math.max(1, Number(get("page")) || 1);

  const where: Prisma.ProductWhereInput = {
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { activeIngredient: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(category && { categories: { some: { categoryId: category } } }),
    ...((status === "DRAFT" || status === "PUBLISHED") && { status }),
    ...(stok === "habis" && { trackStock: true, stock: 0 }),
    ...(stok === "menipis" && { trackStock: true, stock: { gt: 0, lte: 5 } }),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "name" ? { name: "asc" } : sort === "price" ? { price: "asc" } : sort === "stock" ? { stock: "asc" } : { updatedAt: "desc" };

  const [total, products, categories] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        categories: { include: { category: { select: { name: true } } } },
      },
    }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, parentId: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const params = { q, kategori: category, status, stok, sort };
  const currentUrl = buildQuery("/admin/produk", { ...params, page: page > 1 ? page : undefined });

  return (
    <>
      <PageHeader
        title="Produk"
        description={`${total} produk`}
        actions={
          <>
            <Link href="/admin/produk/import" className="btn-outline">Import / Export CSV</Link>
            <Link href="/admin/produk/baru" className="btn-primary">+ Tambah Produk</Link>
          </>
        }
      />
      <Flash searchParams={sp} />

      <form className="card mb-4 grid gap-3 p-4 md:grid-cols-[1fr_repeat(4,auto)_auto]">
        <input name="q" defaultValue={q} placeholder="Cari nama, SKU, zat aktif..." className="input" />
        <select name="kategori" defaultValue={category ?? ""} className="input">
          <option value="">Semua kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.parentId ? `— ${c.name}` : c.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="input">
          <option value="">Semua status</option>
          <option value="PUBLISHED">Publish</option>
          <option value="DRAFT">Draft</option>
        </select>
        <select name="stok" defaultValue={stok ?? ""} className="input">
          <option value="">Semua stok</option>
          <option value="menipis">Stok menipis (≤5)</option>
          <option value="habis">Stok habis</option>
        </select>
        <select name="sort" defaultValue={sort} className="input">
          <option value="updated">Terakhir diubah</option>
          <option value="name">Nama A–Z</option>
          <option value="price">Harga termurah</option>
          <option value="stock">Stok tersedikit</option>
        </select>
        <button className="btn-primary">Filter</button>
      </form>

      <form id="bulk" action={bulkProductAction} className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <input type="hidden" name="back" value={currentUrl} />
        <span className="text-gray-600">Aksi untuk produk terpilih:</span>
        <select name="bulkAction" className="input w-auto py-1.5" defaultValue="">
          <option value="">Pilih aksi</option>
          <option value="publish">Publish</option>
          <option value="draft">Jadikan draft</option>
          <option value="category">Pindahkan ke kategori…</option>
          <option value="delete">Hapus</option>
        </select>
        <select name="categoryId" className="input w-auto py-1.5" defaultValue="">
          <option value="">(kategori tujuan)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.parentId ? `— ${c.name}` : c.name}</option>
          ))}
        </select>
        <BulkSubmit />
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="w-10 px-3 py-3"><SelectAll form="bulk" /></th>
              <th className="px-3 py-3">Produk</th>
              <th className="px-3 py-3">Kategori</th>
              <th className="px-3 py-3">Harga & Stok</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id} className="align-middle hover:bg-gray-50">
                <td className="px-3 py-2">
                  <input type="checkbox" name="ids" value={p.id} form="bulk" aria-label={`Pilih ${p.name}`} className="h-4 w-4 accent-brand-600" />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
                      <ProductImage src={p.images[0]?.url} alt={p.name} sizes="48px" />
                    </span>
                    <span>
                      <Link href={`/admin/produk/${p.id}`} className="font-semibold text-gray-900 hover:text-brand-700">{p.name}</Link>
                      <span className="block text-xs text-gray-500">
                        {p.sku ?? "tanpa SKU"}
                        {p.isFeatured && " · Unggulan"}
                        {p.isBestSeller && " · Best Seller"}
                        {p.requiresPrescription && " · Resep"}
                      </span>
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-gray-600">{p.categories.map((c) => c.category.name).join(", ") || "—"}</td>
                <td className="px-3 py-2">
                  <form action={quickUpdateProduct.bind(null, p.id)} className="flex items-center gap-1.5">
                    <input name="price" type="number" min={0} defaultValue={p.price} aria-label="Harga" className="input w-28 py-1" />
                    <input
                      name="stock"
                      type="number"
                      min={0}
                      defaultValue={p.stock}
                      aria-label="Stok"
                      className={`input w-20 py-1 ${p.trackStock && p.stock === 0 ? "border-red-300 text-red-600" : ""}`}
                    />
                    <SubmitButton className="rounded-md px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50" pendingText="...">
                      Simpan
                    </SubmitButton>
                  </form>
                  <span className="text-xs text-gray-400">{formatRupiah(p.price)}{!p.trackStock && " · stok tidak dilacak"}</span>
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                    {p.status === "PUBLISHED" ? "Publish" : "Draft"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/admin/produk/${p.id}`} className="font-semibold text-brand-700 hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-gray-500">Tidak ada produk.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} href={(p) => buildQuery("/admin/produk", { ...params, page: p })} />
    </>
  );
}
