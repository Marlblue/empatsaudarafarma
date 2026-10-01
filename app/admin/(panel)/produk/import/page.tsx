import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { PRODUCT_CSV_COLUMNS } from "@/lib/product-csv";
import { PageHeader } from "@/components/admin/page-header";
import { ImportForm } from "./import-form";

export const metadata: Metadata = { title: "Import / Export Produk" };

const COLUMN_HELP: Partial<Record<(typeof PRODUCT_CSV_COLUMNS)[number], string>> = {
  sku: "Kode unik; dipakai untuk mencocokkan produk saat update",
  name: "Wajib",
  price: "Wajib, angka tanpa titik (mis. 215000)",
  categories: "Nama kategori, pisahkan dengan | (kategori baru dibuat otomatis)",
  track_stock: "1/0, default 1",
  requires_prescription: "1 = obat keras/wajib resep",
  featured: "1 = tampil di Produk Unggulan",
  best_seller: "1 = tandai Best Seller",
  status: "PUBLISHED atau DRAFT (default PUBLISHED)",
  image_urls: "URL gambar, pisahkan dengan | (diunduh otomatis)",
};

export default async function ImportPage() {
  await requireStaff();
  return (
    <>
      <PageHeader title="Import / Export Produk" back={{ href: "/admin/produk", label: "Daftar produk" }} />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card space-y-4 p-5">
          <h2 className="font-bold text-gray-900">Import dari CSV</h2>
          <p className="text-sm text-gray-600">
            Gunakan template agar kolom sesuai. File dari Excel (pemisah koma atau titik koma) didukung.
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- unduhan file dari route handler */}
          <a href="/admin/produk/export?template=1" className="btn-outline">Unduh Template CSV</a>
          <ImportForm />
        </section>
        <section className="space-y-6">
          <div className="card space-y-3 p-5">
            <h2 className="font-bold text-gray-900">Export ke CSV</h2>
            <p className="text-sm text-gray-600">Unduh seluruh produk (termasuk draft) dalam format yang sama dengan template.</p>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- unduhan file dari route handler */}
            <a href="/admin/produk/export" className="btn-primary">Export Semua Produk</a>
          </div>
          <div className="card p-5">
            <h2 className="mb-3 font-bold text-gray-900">Kolom CSV</h2>
            <dl className="space-y-1 text-sm">
              {PRODUCT_CSV_COLUMNS.map((c) => (
                <div key={c} className="grid grid-cols-[170px_1fr] gap-2">
                  <dt className="font-mono text-xs text-brand-700">{c}</dt>
                  <dd className="text-gray-600">{COLUMN_HELP[c] ?? ""}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>
    </>
  );
}
