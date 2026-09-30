# Apotek Online (referensi: amanfarma.com)

Website apotek online (tampilan meniru amanfarma.com: tema Flatsome, font Lato, latar biru muda) dengan katalog, keranjang, checkout (transfer bank / COD), order via WhatsApp, dan **admin panel untuk mengelola produk**. Kebutuhan lengkap ada di [docs/PRD.md](docs/PRD.md).

**Stack:** Next.js 16 (App Router, Server Actions) · React 19 · Tailwind CSS 4 · PostgreSQL · Prisma 7

## Menjalankan secara lokal

```bash
pnpm install          # juga menjalankan prisma generate
cp .env.example .env  # sesuaikan DATABASE_URL bila memakai Postgres sendiri
pnpm db:start         # Postgres lokal via `prisma dev` (port 51218)
pnpm db:migrate       # buat tabel
pnpm db:seed          # akun admin, slider "Cara Pemesanan", tarif ongkir
pnpm import:amanfarma # tarik 449 produk + foto + kategori dari amanfarma.com (menimpa katalog)
pnpm dev
```

- Toko: http://localhost:3000
- Admin: http://localhost:3000/admin — login awal `admin@farma.local` / `admin12345` (**segera ganti** di menu Pengguna Admin)

## Fitur

**Toko:** beranda (banner, keunggulan, unggulan, best seller, terbaru), toko & kategori (sort, filter harga/stok, pagination), pencarian dengan saran otomatis, quick view, detail produk (galeri zoom, spesifikasi obat, share, ulasan, produk terkait, JSON-LD), keranjang, checkout, instruksi transfer + upload bukti, akun (pesanan, alamat, profil), tombol & pesan WhatsApp, tentang, kontak, newsletter, sitemap/robots.

**Admin (`/admin`):** dashboard, produk (tambah/edit/hapus, banyak gambar, harga coret, stok, spesifikasi, wajib resep, unggulan/best seller, draft/publish, duplikat, edit cepat harga & stok, aksi massal, import/export CSV), kategori bertingkat, pesanan (verifikasi bukti transfer, ubah status, resi, invoice, pembatalan otomatis + stok kembali), pelanggan, ulasan, pesan kontak, newsletter, banner, pengaturan toko & ongkir per provinsi, pengguna admin/staf.

## Struktur

```
app/(shop)/        halaman toko
app/admin/         admin panel ((panel)/ memakai layout sidebar)
app/actions/       server actions toko      app/admin/actions/  server actions admin
lib/               db, auth, katalog, keranjang, ongkir, CSV, penyimpanan file
components/        komponen UI toko & admin
prisma/            schema, migrasi, seed
```

## Aset

- `public/images/site/` — logo, slider, banner Best Seller/New Arrival, ikon layanan, logo BCA/kurir/marketplace (diambil dari amanfarma.com).
- `uploads/products/` — foto produk hasil import (tidak ikut git, ±53 MB). Salin folder ini saat deploy.

## Catatan produksi

- **Upload file** disimpan di folder `UPLOAD_DIR` (default `./uploads`) dan disajikan lewat `/uploads/...`. Cocok untuk VPS. Untuk hosting serverless (Vercel), ganti implementasi `lib/storage.ts` dengan Vercel Blob / S3.
- Bukti transfer (`/uploads/proofs`) hanya bisa dibuka admin/staf.
- Set `SITE_URL` (mis. `https://domainanda.com`) untuk sitemap, canonical, dan link share.
- Rate limit login/form berada di memori proses (`lib/rate-limit.ts`); untuk banyak instance ganti dengan Redis.
- Reset password via email belum aktif (butuh layanan email); sementara admin bisa membuat password sementara dari halaman detail pelanggan.
