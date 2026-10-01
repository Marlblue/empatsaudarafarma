import type { Metadata } from "next";
import Image from "next/image";
import { deleteBanner, saveBanner } from "@/app/admin/actions/misc";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Banner" };

type Banner = {
  id: string;
  title: string | null;
  imageDesktop: string;
  imageMobile: string | null;
  link: string | null;
  sortOrder: number;
  isActive: boolean;
};

function BannerFields({ banner }: { banner?: Banner }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="block">
        <span className="label">Judul / teks alternatif</span>
        <input name="title" defaultValue={banner?.title ?? ""} className="input" />
      </label>
      <label className="block">
        <span className="label">Link saat diklik (opsional)</span>
        <input name="link" defaultValue={banner?.link ?? ""} placeholder="/kategori/insulin-diabetes" className="input" />
      </label>
      <label className="block">
        <span className="label">Gambar desktop {banner ? "(upload untuk mengganti)" : "*"} — rasio 3:1, mis. 1500×500</span>
        <input name="imageDesktop" type="file" accept="image/jpeg,image/png,image/webp" required={!banner} className="block text-sm" />
      </label>
      <label className="block">
        <span className="label">Gambar mobile (opsional) — rasio 16:9</span>
        <input name="imageMobile" type="file" accept="image/jpeg,image/png,image/webp" className="block text-sm" />
      </label>
      <label className="block">
        <span className="label">Urutan</span>
        <input name="sortOrder" type="number" defaultValue={banner?.sortOrder ?? 0} className="input" />
      </label>
      <label className="flex items-center gap-2 self-end pb-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={banner?.isActive ?? true} className="h-4 w-4 accent-brand-600" />
        Aktif (tampil di beranda)
      </label>
    </div>
  );
}

export default async function BannersPage({ searchParams }: PageProps<"/admin/banner">) {
  await requireStaff({ adminOnly: true });
  const banners = await db.banner.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <>
      <PageHeader title="Banner Beranda" description="Carousel di bagian atas beranda. Tanpa banner aktif, beranda menampilkan hero bawaan." />
      <Flash searchParams={await searchParams} />
      <details className="card mb-6 p-5">
        <summary className="cursor-pointer font-bold text-brand-700">+ Tambah Banner</summary>
        <form action={saveBanner.bind(null, null)} className="mt-4 space-y-4">
          <BannerFields />
          <SubmitButton>Simpan Banner</SubmitButton>
        </form>
      </details>
      <div className="space-y-4">
        {banners.map((b) => (
          <div key={b.id} className="card overflow-hidden">
            <div className="relative aspect-[3/1] bg-gray-100">
              <Image src={b.imageDesktop} alt={b.title ?? ""} fill unoptimized className="object-cover" />
              {!b.isActive && <span className="absolute left-3 top-3 rounded bg-gray-900/80 px-2 py-0.5 text-xs text-white">Nonaktif</span>}
            </div>
            <details className="p-4">
              <summary className="cursor-pointer text-sm font-semibold text-brand-700">
                {b.title || "Tanpa judul"} · urutan {b.sortOrder} — Edit
              </summary>
              <form action={saveBanner.bind(null, b.id)} className="mt-4 space-y-4">
                <BannerFields banner={b} />
                <SubmitButton>Simpan Perubahan</SubmitButton>
              </form>
              <form action={deleteBanner.bind(null, b.id)} className="mt-3">
                <ConfirmButton message="Hapus banner ini?">Hapus banner</ConfirmButton>
              </form>
            </details>
          </div>
        ))}
        {banners.length === 0 && <p className="card p-8 text-center text-gray-500">Belum ada banner.</p>}
      </div>
    </>
  );
}
