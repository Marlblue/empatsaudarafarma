"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { saveProduct, type ProductFormState } from "@/app/admin/actions/products";

export type ProductFormData = {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  trackStock: boolean;
  weightGram: number;
  genericName: string | null;
  activeIngredient: string | null;
  brand: string | null;
  registrant: string | null;
  dosageForm: string | null;
  packaging: string | null;
  manufacturer: string | null;
  bpomNumber: string | null;
  shortDescription: string | null;
  description: string | null;
  requiresPrescription: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  status: "DRAFT" | "PUBLISHED";
  metaTitle: string | null;
  metaDescription: string | null;
  images: { id: string; url: string }[];
  categoryIds: string[];
};

type CategoryOption = { id: string; name: string; depth: number };

export function ProductForm({ product, categories }: { product?: ProductFormData; categories: CategoryOption[] }) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(
    saveProduct.bind(null, product?.id ?? null),
    null,
  );
  const [images, setImages] = useState(product?.images ?? []);
  const [newFiles, setNewFiles] = useState<{ file: File; preview: string }[]>([]);
  const err = (k: string) => state?.fieldErrors?.[k]?.[0];

  useEffect(() => () => newFiles.forEach((f) => URL.revokeObjectURL(f.preview)), [newFiles]);

  const move = (i: number, dir: -1 | 1) =>
    setImages((list) => {
      const next = [...list];
      const j = i + dir;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <form
      action={(fd) => {
        fd.delete("newImages");
        newFiles.forEach((f) => fd.append("newImages", f.file));
        formAction(fd);
      }}
      className="grid gap-6 xl:grid-cols-[1fr_340px]"
    >
      <div className="space-y-6">
        <Section title="Informasi Utama">
          <Text name="name" label="Nama produk *" defaultValue={product?.name} required error={err("name")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Text name="slug" label="Slug URL" defaultValue={product?.slug} hint="Kosongkan agar dibuat otomatis dari nama" error={err("slug")} />
            <Text name="sku" label="SKU" defaultValue={product?.sku} error={err("sku")} />
          </div>
          <Area name="shortDescription" label="Deskripsi singkat" rows={2} defaultValue={product?.shortDescription} />
          <Area
            name="description"
            label="Deskripsi lengkap"
            rows={8}
            defaultValue={product?.description}
            hint="Pisahkan paragraf dengan baris kosong. Awali baris dengan “- ” untuk membuat daftar."
          />
        </Section>

        <Section title="Gambar Produk">
          <p className="text-xs text-gray-500">Gambar pertama menjadi gambar utama. JPG/PNG/WebP, maks. 5 MB per file.</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {images.map((img, i) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                <input type="hidden" name="keepImageIds" value={img.id} />
                <Image src={img.url} alt="" fill unoptimized className="object-contain p-1" />
                {i === 0 && <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 text-[10px] font-bold text-white">Utama</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/60 p-1 text-xs text-white">
                  <button type="button" onClick={() => move(i, -1)} aria-label="Geser kiri" className="px-1">‹</button>
                  <button type="button" onClick={() => setImages((l) => l.filter((x) => x.id !== img.id))} className="px-1 text-red-300">
                    Hapus
                  </button>
                  <button type="button" onClick={() => move(i, 1)} aria-label="Geser kanan" className="px-1">›</button>
                </div>
              </div>
            ))}
            {newFiles.map((f, i) => (
              <div key={f.preview} className="relative aspect-square overflow-hidden rounded-lg border-2 border-dashed border-brand-300 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element -- pratinjau blob lokal */}
                <img src={f.preview} alt="" className="h-full w-full object-contain p-1" />
                <span className="absolute left-1 top-1 rounded bg-amber-500 px-1.5 text-[10px] font-bold text-white">Baru</span>
                <button
                  type="button"
                  onClick={() => setNewFiles((l) => l.filter((_, j) => j !== i))}
                  className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-xs text-red-300"
                >
                  Batal
                </button>
              </div>
            ))}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-center text-xs text-gray-500 hover:border-brand-500 hover:text-brand-700">
              <span className="text-2xl">+</span>
              Tambah gambar
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(e) => {
                  const files = [...(e.target.files ?? [])];
                  setNewFiles((l) => [...l, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        </Section>

        <Section title="Spesifikasi Obat">
          <div className="grid gap-4 sm:grid-cols-2">
            <Text name="genericName" label="Nama produk (generik)" defaultValue={product?.genericName} placeholder="mis. AMINOPHYLLINE" />
            <Text name="dosageForm" label="Bentuk sediaan" defaultValue={product?.dosageForm} placeholder="mis. INJEKSI; 24 MG" />
            <Text name="activeIngredient" label="Komposisi / zat aktif" defaultValue={product?.activeIngredient} />
            <Text name="brand" label="Merk" defaultValue={product?.brand} />
            <Text name="packaging" label="Kemasan" defaultValue={product?.packaging} placeholder="mis. DUS, 30 AMPUL @ 10 ML" />
            <Text name="registrant" label="Pendaftar" defaultValue={product?.registrant} />
            <Text name="manufacturer" label="Diproduksi oleh" defaultValue={product?.manufacturer} />
            <Text name="bpomNumber" label="No. registrasi BPOM" defaultValue={product?.bpomNumber} />
            <Text name="weightGram" label="Berat (gram)" type="number" min={0} defaultValue={product?.weightGram ?? 0} error={err("weightGram")} />
          </div>
        </Section>

        <Section title="SEO (opsional)">
          <Text name="metaTitle" label="Meta title" defaultValue={product?.metaTitle} hint="Default: nama produk" />
          <Area name="metaDescription" label="Meta description" rows={2} defaultValue={product?.metaDescription} hint="Default: deskripsi singkat" />
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Publikasi">
          <label className="block">
            <span className="label">Status</span>
            <select name="status" defaultValue={product?.status ?? "PUBLISHED"} className="input">
              <option value="PUBLISHED">Publish (tampil di toko)</option>
              <option value="DRAFT">Draft (disembunyikan)</option>
            </select>
          </label>
          <Check name="isFeatured" label="Tampilkan di Produk Unggulan" defaultChecked={product?.isFeatured} />
          <Check name="isBestSeller" label="Tandai sebagai Best Seller" defaultChecked={product?.isBestSeller} />
          <Check name="requiresPrescription" label="Obat keras (wajib resep dokter)" defaultChecked={product?.requiresPrescription} />
          {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
          {state?.fieldErrors && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">Periksa kembali isian yang ditandai.</p>}
          <button disabled={pending} className="btn-primary w-full">
            {pending ? "Menyimpan..." : "Simpan Produk"}
          </button>
        </Section>

        <Section title="Harga & Stok">
          <Text name="price" label="Harga jual (Rp) *" type="number" min={0} defaultValue={product?.price} required error={err("price")} />
          <Text
            name="compareAtPrice"
            label="Harga coret (Rp)"
            type="number"
            min={0}
            defaultValue={product?.compareAtPrice ?? ""}
            hint="Isi untuk menampilkan diskon"
            error={err("compareAtPrice")}
          />
          <Text name="stock" label="Stok" type="number" min={0} defaultValue={product?.stock ?? 0} error={err("stock")} />
          <Check name="trackStock" label="Lacak stok (tolak pesanan bila habis)" defaultChecked={product?.trackStock ?? true} />
        </Section>

        <Section title="Kategori">
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm" style={{ paddingLeft: c.depth * 16 }}>
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={c.id}
                  defaultChecked={product?.categoryIds.includes(c.id)}
                  className="h-4 w-4 accent-brand-600"
                />
                {c.name}
              </label>
            ))}
            {categories.length === 0 && <p className="text-sm text-gray-500">Belum ada kategori.</p>}
          </div>
        </Section>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-5">
      <h2 className="font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function Text({
  label,
  hint,
  error,
  defaultValue,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue"> & {
  label: string;
  hint?: string;
  error?: string;
  defaultValue?: string | number | null;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input className={`input ${error ? "border-red-400" : ""}`} defaultValue={defaultValue ?? undefined} {...props} />
      {hint && !error && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function Area({
  label,
  hint,
  defaultValue,
  ...props
}: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "defaultValue"> & {
  label: string;
  hint?: string;
  defaultValue?: string | null;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <textarea className="input" defaultValue={defaultValue ?? undefined} {...props} />
      {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

function Check({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      <input type="checkbox" className="h-4 w-4 accent-brand-600" {...props} />
      {label}
    </label>
  );
}
