import type { Metadata } from "next";
import { deleteShippingRate, saveShippingRate, updateSettings } from "@/app/admin/actions/misc";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { formatRupiah } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { JABODETABEK, PROVINCES } from "@/lib/shipping";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Pengaturan Toko" };

function Field({ label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className="input" {...props} />
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

function Area({ label, hint, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea className="input font-mono text-xs" {...props} />
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

export default async function SettingsPage({ searchParams }: PageProps<"/admin/pengaturan">) {
  await requireStaff({ adminOnly: true });
  const [s, rates] = await Promise.all([getSettings(), db.shippingRate.findMany({ orderBy: { region: "asc" } })]);

  return (
    <>
      <PageHeader title="Pengaturan Toko" />
      <Flash searchParams={await searchParams} />
      <form action={updateSettings} className="grid gap-6 xl:grid-cols-2">
        <section className="card space-y-4 p-5">
          <h2 className="font-bold text-gray-900">Identitas Toko</h2>
          <Field label="Nama toko" name="storeName" defaultValue={s.storeName} required />
          <Field label="Tagline" name="tagline" defaultValue={s.tagline} />
          <label className="block">
            <span className="label">Logo {s.logoUrl && "(sudah ada — upload untuk mengganti)"}</span>
            <input type="file" name="logo" accept="image/png,image/jpeg,image/webp" className="block text-sm" />
            {s.logoUrl && (
              <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" name="removeLogo" className="h-4 w-4" /> Hapus logo (pakai logo teks)
              </label>
            )}
          </label>
          <Field label="Info izin apotek & SIPA (tampil di footer)" name="licenseInfo" defaultValue={s.licenseInfo} />
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="font-bold text-gray-900">Kontak</h2>
          <Field label="No. WhatsApp" name="whatsapp" defaultValue={s.whatsapp} required hint="Dipakai untuk semua tombol WhatsApp" />
          <Field label="Nama CS WhatsApp" name="csName" defaultValue={s.csName} hint="Tampil di footer & halaman About Us" />
          <Field label="Email (opsional)" name="email" type="email" defaultValue={s.email} />
          <Field label="Jam operasional" name="hours" defaultValue={s.hours} />
          <Area label="Alamat" name="address" rows={2} defaultValue={s.address} />
          <Field
            label="URL embed Google Maps (opsional)"
            name="mapEmbedUrl"
            defaultValue={s.mapEmbedUrl}
            hint="Google Maps → Bagikan → Sematkan peta → salin URL di dalam src=&quot;...&quot;"
          />
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="font-bold text-gray-900">Pembayaran & Ongkir</h2>
          <Area
            label="Rekening bank"
            name="banks"
            rows={3}
            defaultValue={s.banks.map((b) => `${b.bank} | ${b.number} | ${b.holder}`).join("\n")}
            hint="Satu rekening per baris: Bank | Nomor | Atas nama"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Ongkir flat (Rp)" name="flatShippingCost" type="number" min={0} defaultValue={s.flatShippingCost} hint="Untuk provinsi tanpa tarif khusus" />
            <Field label="Gratis ongkir min. (Rp)" name="freeShippingMin" type="number" min={0} defaultValue={s.freeShippingMin} hint="0 = tidak ada" />
            <Field label="Batas bayar (jam)" name="paymentDueHours" type="number" min={1} defaultValue={s.paymentDueHours} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="codEnabled" defaultChecked={s.codEnabled} className="h-4 w-4 accent-brand-600" />
            Aktifkan pembayaran COD
          </label>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="font-bold text-gray-900">Marketplace & Media Sosial</h2>
          <Field label="Tokopedia" name="tokopediaUrl" defaultValue={s.tokopediaUrl} />
          <Field label="Shopee" name="shopeeUrl" defaultValue={s.shopeeUrl} />
          <Field label="Instagram" name="instagramUrl" defaultValue={s.instagramUrl} />
          <Field label="Facebook" name="facebookUrl" defaultValue={s.facebookUrl} />
          <Field label="Twitter / X" name="twitterUrl" defaultValue={s.twitterUrl} />
        </section>

        <section className="card space-y-4 p-5 xl:col-span-2">
          <h2 className="font-bold text-gray-900">Konten Beranda & Tentang Kami</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Area
              label="Strip keunggulan (di bawah banner)"
              name="features"
              rows={4}
              defaultValue={s.features.map((f) => `${f.title} | ${f.text}`).join("\n")}
              hint="Satu per baris: Judul | Keterangan"
            />
            <Area
              label="Highlight layanan (bagian bawah beranda)"
              name="services"
              rows={4}
              defaultValue={s.services.map((f) => `${f.title} | ${f.text}`).join("\n")}
              hint="Satu per baris: Judul | Keterangan"
            />
          </div>
          <Area
            label="Isi halaman Tentang Kami"
            name="aboutContent"
            rows={8}
            defaultValue={s.aboutContent}
            hint="Pisahkan paragraf dengan baris kosong. Awali baris dengan “- ” untuk daftar."
          />
        </section>

        <div className="xl:col-span-2">
          <SubmitButton className="btn-primary px-8">Simpan Pengaturan</SubmitButton>
        </div>
      </form>

      <section className="card mt-8 p-5">
        <h2 className="mb-1 font-bold text-gray-900">Tarif Ongkir per Wilayah</h2>
        <p className="mb-4 text-sm text-gray-500">
          Urutan tarif: <strong>Jabodetabek</strong> (Jakarta, Bogor, Depok, Tangerang, Tangerang Selatan, Bekasi) →
          tarif provinsi → ongkir flat ({formatRupiah(s.flatShippingCost)}) untuk provinsi yang tidak diatur.
        </p>
        <form action={saveShippingRate} className="mb-4 flex flex-wrap gap-2">
          <select name="region" required className="input w-auto" defaultValue="">
            <option value="" disabled>Pilih wilayah</option>
            <option value={JABODETABEK}>{JABODETABEK} (Jakarta, Bogor, Depok, Tangerang, Bekasi)</option>
            <optgroup label="Provinsi">
              {PROVINCES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </optgroup>
          </select>
          <input name="cost" type="number" min={0} required placeholder="Tarif (Rp)" className="input w-40" />
          <SubmitButton>Simpan Tarif</SubmitButton>
        </form>
        <ul className="divide-y divide-gray-100 text-sm">
          {rates.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-2">
              <span>{r.region}</span>
              <span className="flex items-center gap-4">
                <strong>{formatRupiah(r.cost)}</strong>
                <form action={deleteShippingRate.bind(null, r.id)}>
                  <ConfirmButton message={`Hapus tarif ${r.region}?`}>Hapus</ConfirmButton>
                </form>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
