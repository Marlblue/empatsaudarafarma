# PRD — Website Apotek Online (Referensi: amanfarma.com)

| | |
|---|---|
| **Versi** | 1.0 (draft) |
| **Tanggal** | 29 September 2026 |
| **Penyusun** | Hilmy Hafizh |
| **Status** | Menunggu review klien |
| **Referensi** | https://amanfarma.com |

---

## 1. Ringkasan & Tujuan

Klien ingin website apotek online dengan **fitur dan tampilan seperti amanfarma.com**. Perbedaan utamanya: klien harus bisa **mengelola produk sendiri** (tambah, ubah, hapus, stok, harga, gambar) tanpa bantuan developer.

Situs referensi saat ini dibangun dengan WordPress + WooCommerce, berisi ±449 produk alat kesehatan dan obat (injeksi, insulin, infus, albumin, multivitamin, dll.). Pembayaran lewat transfer bank manual / COD, dengan WhatsApp sebagai kanal utama layanan pelanggan.

### Tujuan
1. Menyediakan katalog produk apotek yang mudah dicari dan dibeli, dari HP maupun desktop.
2. Memungkinkan pelanggan memesan lewat keranjang/checkout atau langsung via WhatsApp.
3. Memberi admin panel yang sederhana untuk mengelola produk, kategori, pesanan, dan konten situs.

### Metrik keberhasilan
| Metrik | Target |
|---|---|
| Waktu admin menambah 1 produk baru (lengkap dengan gambar) | < 3 menit |
| Largest Contentful Paint (LCP) halaman produk di mobile | < 2,5 detik |
| Semua pesanan checkout tercatat di admin dengan status yang jelas | 100% |
| Migrasi produk dari data lama via import CSV | ±449 produk dalam 1 kali import |

---

## 2. Pengguna & Peran

| Peran | Deskripsi | Akses |
|---|---|---|
| **Pengunjung** | Belum login | Lihat katalog, cari produk, keranjang, order via WhatsApp |
| **Pelanggan** | Punya akun | Semua akses pengunjung + checkout, riwayat pesanan, konfirmasi pembayaran, alamat tersimpan, ulasan |
| **Admin** | Pemilik/pengelola apotek | Seluruh admin panel |
| **Staf** *(opsional)* | Karyawan | Admin panel terbatas: produk & pesanan, tanpa pengaturan & manajemen user |

---

## 3. Ruang Lingkup

### Termasuk (MVP)
- Storefront lengkap seperti amanfarma.com (beranda, toko, kategori, pencarian, detail produk, keranjang, checkout, akun, tentang, kontak).
- Pembayaran **transfer bank manual** (dengan upload bukti) dan **COD**.
- Order via **WhatsApp** (per produk dan dari keranjang).
- Admin panel: produk, kategori, pesanan, banner, pengaturan toko, pelanggan, ulasan, newsletter.
- Import/export produk via CSV.
- SEO dasar & responsif mobile.

### Tidak termasuk (fase berikutnya)
- Payment gateway otomatis (Midtrans/Xendit, QRIS, VA).
- Upload & verifikasi resep dokter.
- Sinkronisasi stok otomatis dengan Tokopedia/Shopee.
- Cek ongkir otomatis multi-kurir (RajaOngkir) — *lihat pertanyaan terbuka*.
- Aplikasi mobile native, multi-cabang, program poin/voucher.

---

## 4. Kebutuhan Fungsional — Storefront

### 4.1 Header & elemen global
- Logo (link ke beranda), **search bar**, menu: Beranda, Toko, Tentang Kami, Kontak.
- Link Masuk / Daftar (atau nama pelanggan jika sudah login).
- Ikon keranjang dengan **jumlah item dan total harga**.
- **Widget WhatsApp melayang** di pojok kanan bawah di semua halaman.
- Header menyesuaikan di mobile (menu hamburger, search tetap mudah dijangkau).

### 4.2 Beranda
Urutan section mengikuti referensi:
1. **Carousel banner** — gambar & link diatur dari admin, auto-slide dengan tombol panah.
2. **Strip keunggulan** — mis. "Gratis Ongkir", "Bisa COD", link toko Tokopedia & Shopee (teks dan link diatur dari admin).
3. **Produk Unggulan** — produk yang ditandai "Unggulan" di admin.
4. **Best Seller** — produk terlaris (berdasarkan jumlah terjual, atau ditandai manual) + link "Lihat semua".
5. **Produk Terbaru** — produk terbaru dipublikasi.
6. **Highlight layanan** — Customer Service, Jaminan Kualitas, Pengiriman Cepat.
7. **Footer**.

### 4.3 Halaman Toko & Kategori (`/shop`, `/kategori/[slug]`)
- Grid produk, **12 produk per halaman**, dengan pagination bernomor.
- Keterangan jumlah: "Menampilkan 1–12 dari 449 hasil".
- **Sidebar kategori** (termasuk sub-kategori) — di mobile menjadi drawer/filter.
- **Urutkan**: Terpopuler, Rating tertinggi, Terbaru, Harga terendah, Harga tertinggi.
- *(Tambahan)* Filter rentang harga dan "hanya yang tersedia".
- **Kartu produk**: gambar, label kategori, nama, harga (Rp), harga coret & badge diskon jika ada, badge "Stok Habis" jika stok 0, tombol **Quick View**.

**Kriteria penerimaan**
- Mengubah urutan/filter/halaman memperbarui URL (bisa dibagikan & di-bookmark).
- Produk berstatus Draft tidak tampil.

### 4.4 Pencarian (`/cari?q=`)
- Mencari berdasarkan **nama produk, zat aktif, pabrik, dan SKU**.
- Saran/autocomplete saat mengetik (maks. 6 produk).
- Hasil memakai tampilan grid yang sama dengan halaman Toko.
- Pesan "Produk tidak ditemukan" + tombol tanya via WhatsApp jika hasil kosong.

### 4.5 Quick View
- Modal berisi gambar, nama, harga, ringkasan, input jumlah, **Tambah ke Keranjang**, dan link ke halaman detail.

### 4.6 Detail Produk (`/produk/[slug]`)
- **Breadcrumb**: Beranda / Kategori / Nama Produk.
- **Galeri gambar** dengan zoom & thumbnail.
- Nama, harga (plus harga coret jika diskon), status stok, berat, kategori, SKU.
- **Tabel spesifikasi**: zat aktif, bentuk sediaan & dosis, kemasan, pabrik, no. registrasi BPOM.
- Label **"Wajib Resep Dokter"** untuk produk yang ditandai (lihat 12. Pertanyaan terbuka).
- Input jumlah + **Tambah ke Keranjang** + **Pesan via WhatsApp** (pesan otomatis berisi nama produk, jumlah, harga, dan link produk).
- Tombol share: WhatsApp, Facebook, X, Pinterest, LinkedIn, Email, salin link.
- Tab: **Deskripsi**, **Informasi Tambahan**, **Ulasan** (rating bintang + komentar; hanya pelanggan login yang bisa mengulas, tampil setelah disetujui admin).
- **Produk terkait** (kategori yang sama).

### 4.7 Keranjang (`/keranjang`)
- Daftar item: gambar, nama, harga, jumlah (ubah/hapus), subtotal.
- Total harga, tombol **Checkout** dan **Pesan Semua via WhatsApp**.
- Keranjang tersimpan untuk pengunjung (cookie) dan digabung ke akun saat login.
- Jumlah tidak boleh melebihi stok yang tersedia.

### 4.8 Checkout (`/checkout`)
- Wajib login (atau daftar cepat di halaman checkout).
- Data penerima: nama, no. HP/WA, alamat lengkap (provinsi, kota, kecamatan, kode pos), catatan; bisa memilih alamat tersimpan.
- **Ongkir**: tarif flat atau per wilayah yang diatur admin; mendukung aturan "gratis ongkir" di atas nominal tertentu.
- **Metode pembayaran**: Transfer Bank (rekening diatur admin) atau COD (bisa diaktifkan/nonaktifkan dan dibatasi per wilayah).
- Ringkasan pesanan: item, subtotal, ongkir, total.
- Setelah pesanan dibuat: stok berkurang (dikembalikan jika pesanan batal), kode pesanan dibuat (mis. `AF-20260929-0012`).

### 4.9 Halaman Pesanan & Konfirmasi Pembayaran (`/pesanan/[kode]`)
- Menampilkan status pesanan, rincian, dan **instruksi transfer** (bank, no. rekening, atas nama, total, batas waktu bayar mis. 1×24 jam).
- Form **konfirmasi pembayaran**: upload bukti transfer (JPG/PNG/PDF, maks. 5 MB), nama pengirim, bank asal.
- Tombol "Konfirmasi via WhatsApp" sebagai alternatif.

### 4.10 Akun Pelanggan (`/akun`)
- Daftar, masuk, lupa password (reset via email).
- Riwayat pesanan + status + no. resi.
- Kelola alamat & profil.

### 4.11 Tentang Kami & Kontak
- **Tentang Kami**: konten diatur dari admin (teks + gambar).
- **Kontak**: jam operasional, alamat, peta Google Maps, WhatsApp, email, link media sosial & marketplace, serta **form kontak** (nama, email, no. WA, pesan) yang masuk ke admin dan dikirim ke email admin.

### 4.12 Newsletter
- Form email di header/footer; email tersimpan di admin (anti-duplikat).

### 4.13 Footer
- Logo & deskripsi singkat, CS WhatsApp + jam layanan, email, rekening bank, logo kurir & pembayaran, link Tokopedia/Shopee, menu, media sosial, **info izin apotek & SIPA apoteker**, copyright.

---

## 5. Kebutuhan Fungsional — Admin Panel (`/admin`)

> Inti permintaan klien: pemilik apotek dapat mengelola seluruh isi toko sendiri.

### 5.1 Login & keamanan admin
- Login email + password khusus admin/staf, sesi aman, logout.
- Semua route `/admin` terlindungi dan dicek berdasarkan peran.

### 5.2 Dashboard
- Kartu ringkasan: pesanan baru hari ini, pesanan menunggu verifikasi pembayaran, omzet bulan ini, produk stok habis/menipis.
- Daftar 10 pesanan terbaru.

### 5.3 Manajemen Produk
**Daftar produk**
- Tabel: gambar, nama, SKU, kategori, harga, stok, status, tanggal.
- Cari, filter (kategori, status, stok habis), urutkan, pagination.
- **Aksi massal**: publish/draft, hapus, ubah kategori.
- **Edit cepat** harga & stok langsung di tabel.

**Form produk**
| Field | Keterangan |
|---|---|
| Nama | Wajib |
| Slug | Dibuat otomatis dari nama, bisa diubah, harus unik |
| SKU | Opsional, unik |
| Harga | Wajib, Rupiah |
| Harga coret | Opsional, harus lebih besar dari harga |
| Stok | Angka; opsi "tidak dilacak" |
| Berat (gram) | Untuk ongkir |
| Kategori | Bisa lebih dari satu |
| Gambar | Upload banyak, drag untuk urutkan, gambar pertama = utama; otomatis dikompres |
| Zat aktif, Bentuk sediaan & dosis, Kemasan, Pabrik, No. BPOM | Spesifikasi |
| Deskripsi singkat & lengkap | Editor teks (rich text) |
| Wajib resep | Checkbox |
| Unggulan / Best Seller | Checkbox untuk tampil di beranda |
| Status | Draft / Publish |
| SEO | Meta title & meta description (opsional, default otomatis) |

- Tombol **Pratinjau** produk sebelum publish.
- **Duplikat produk** untuk mempercepat input produk serupa.

**Import / Export CSV**
- Template CSV tersedia untuk diunduh.
- Import dengan validasi per baris dan laporan error (baris ke-berapa, apa masalahnya); mode "tambah baru" atau "perbarui berdasarkan SKU".
- Gambar via kolom URL (diunduh otomatis).
- Export semua/terfilter ke CSV.

### 5.4 Manajemen Kategori
- Tambah/ubah/hapus kategori, **induk–anak** (sub-kategori), gambar, deskripsi, urutan tampil.
- Kategori yang masih berisi produk tidak bisa dihapus sebelum produknya dipindah.
- Data awal: 16 kategori seperti referensi (Alat Cek Gula Darah, Cairan Infus, Albumin, Injeksi Perbox, Injeksi Satuan, Inhaler, Insulin Diabetes, Nebulizer, Pembersih Luka, Alat Infus, Perban & Kasa, Suppositoria, Multivitamin, Pampers Dewasa, Obat Generik, Salep Kulit & Mata, Sirup).

### 5.5 Manajemen Pesanan
- Daftar pesanan dengan filter status, tanggal, metode bayar, dan pencarian (kode/nama/no. HP).
- **Alur status**:

```
Menunggu Pembayaran → Menunggu Verifikasi → Diproses → Dikirim → Selesai
          │                    │                │
          └────────────────────┴────────────────┴──→ Dibatalkan
(COD: Diproses → Dikirim → Selesai)
```

- Detail pesanan: item, data pelanggan, alamat, **bukti transfer** (lihat/perbesar), tombol **Setujui / Tolak pembayaran**, input **kurir & no. resi**, catatan internal, riwayat perubahan status.
- Tombol "Hubungi via WhatsApp" ke pelanggan (pesan otomatis berisi kode & status).
- Cetak invoice / label pengiriman.
- Pembatalan otomatis jika belum dibayar melewati batas waktu (bisa diatur).

### 5.6 Konten & Pengaturan
- **Banner**: tambah/ubah/hapus, gambar desktop & mobile, link, urutan, aktif/nonaktif.
- **Strip keunggulan & highlight layanan**: teks & ikon.
- **Halaman Tentang Kami**: editor konten.
- **Pengaturan toko**: nama, logo, favicon, alamat, no. WhatsApp, email, jam operasional, rekening bank (bisa lebih dari satu), link Tokopedia/Shopee/media sosial, info izin apotek & SIPA.
- **Pengaturan ongkir & pembayaran**: tarif flat/per wilayah, batas gratis ongkir, aktif/nonaktif COD, batas waktu pembayaran.

### 5.7 Pelanggan, Ulasan, Pesan, Newsletter
- **Pelanggan**: daftar, detail, riwayat pesanan, nonaktifkan akun.
- **Ulasan**: setujui/tolak/hapus.
- **Pesan kontak**: kotak masuk dari form kontak, tandai sudah dibaca.
- **Newsletter**: daftar email + export CSV.

### 5.8 Pengguna Admin
- Tambah/nonaktifkan admin & staf, atur peran, reset password.

---

## 6. Kebutuhan Non-Fungsional

| Area | Kebutuhan |
|---|---|
| **SEO** | Halaman katalog di-render di server; metadata per halaman; Open Graph; `sitemap.xml` & `robots.txt` otomatis; structured data `Product` & `BreadcrumbList`; URL ramah (slug) |
| **Performa** | Optimasi gambar (format modern, ukuran responsif, lazy load); cache halaman katalog dan diperbarui saat admin mengubah produk |
| **Responsif** | Mobile-first; diuji di 360 px, 768 px, 1280 px |
| **Keamanan** | Password di-hash; route admin & aksi server dicek peran; validasi input di server; rate limit pada login, form kontak, dan checkout; validasi tipe & ukuran file upload; HTTPS |
| **Aksesibilitas** | Kontras warna cukup, alt text gambar, navigasi keyboard, label form |
| **Data** | Backup database harian; harga & total disimpan sebagai integer Rupiah; snapshot harga/nama di item pesanan |
| **Kepatuhan** | Tampilkan izin apotek & SIPA; disclaimer obat keras / wajib resep; kebijakan privasi & syarat ketentuan |
| **Bahasa & format** | Bahasa Indonesia; format `Rp215.000`; zona waktu WIB |

---

## 7. Desain & UI

Mengikuti tampilan amanfarma.com dengan perapian modern:

- **Gaya**: latar putih, warna utama biru (aksen gelap), kartu produk bersih dengan sudut sedikit membulat, font sans-serif yang mudah dibaca.
- **Komponen utama**: Header (logo, search, menu, akun, keranjang), Carousel, Strip keunggulan, Kartu produk, Grid produk, Sidebar kategori, Breadcrumb, Galeri, Tabel spesifikasi, Tab, Modal Quick View, Tombol WhatsApp melayang, Footer.
- **Wireframe tekstual (desktop)**:

```
Beranda
┌──────────────────────────────────────────────┐
│ Logo | [ Cari produk...        ] | Akun | 🛒 │
│ Beranda  Toko  Tentang Kami  Kontak          │
├──────────────────────────────────────────────┤
│            CAROUSEL BANNER  ‹  ›             │
├──────────────────────────────────────────────┤
│ Gratis Ongkir | Bisa COD | Tokopedia | Shopee│
├──────────────────────────────────────────────┤
│ Produk Unggulan   [□][□][□][□][□]            │
│ Best Seller       [□][□][□][□][□]  Lihat →   │
│ Produk Terbaru    [□][□][□][□][□]            │
├──────────────────────────────────────────────┤
│ CS 24 jam | Jaminan Kualitas | Kirim Cepat   │
├──────────────────────────────────────────────┤
│ FOOTER: kontak · rekening · marketplace · menu│
└──────────────────────────────────────────────┘                    (WA)

Detail Produk
┌──────────────────────────────────────────────┐
│ Beranda / Injeksi Perbox / Aminophylline     │
│ ┌──────────┐  Aminophylline Injeksi          │
│ │  GAMBAR  │  Rp215.000   Stok: Tersedia     │
│ │  (zoom)  │  Kategori · Berat 700 g         │
│ └──────────┘  Spesifikasi (tabel)            │
│ [▫][▫][▫]     [- 1 +] [Tambah ke Keranjang]  │
│               [Pesan via WhatsApp]  Share    │
│ Deskripsi | Info Tambahan | Ulasan (0)       │
│ Produk Terkait [□][□][□][□]                  │
└──────────────────────────────────────────────┘
```

- **Admin panel**: layout sidebar kiri (Dashboard, Produk, Kategori, Pesanan, Pelanggan, Ulasan, Konten, Pengaturan), tabel data dengan aksi di kanan, form dua kolom.
- Aset yang dibutuhkan dari klien: logo, warna brand (jika berbeda), foto banner, foto produk.

---

## 8. Arsitektur Teknis

| Lapisan | Pilihan |
|---|---|
| Framework | **Next.js 16 (App Router)** + React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Database | **PostgreSQL** (Neon atau Supabase) |
| ORM | **Prisma** (skema, migrasi, seed) |
| Auth | Auth.js (credentials; peran `CUSTOMER`, `STAFF`, `ADMIN`) |
| Mutasi data | Server Actions + validasi Zod |
| Penyimpanan gambar | Vercel Blob / S3 / Supabase Storage |
| Rich text editor | Tiptap (atau sejenis) |
| Email | Resend / SMTP (reset password, notifikasi pesanan) |
| Deploy | Vercel (atau VPS dengan Node.js) |

Catatan: versi Next.js yang dipakai memiliki perubahan API dari versi sebelumnya — developer wajib merujuk dokumentasi di `node_modules/next/dist/docs/` sebelum implementasi.

---

## 9. Model Data (ringkas)

| Model | Field utama |
|---|---|
| **User** | id, name, email (unik), phone, passwordHash, role, isActive, createdAt |
| **Address** | id, userId, label, recipient, phone, province, city, district, postalCode, detail, isDefault |
| **Category** | id, name, slug (unik), parentId, image, description, sortOrder |
| **Product** | id, name, slug (unik), sku (unik), price, compareAtPrice, stock, trackStock, weightGram, activeIngredient, dosageForm, packaging, manufacturer, bpomNumber, shortDescription, description, requiresPrescription, isFeatured, isBestSeller, status (`DRAFT`/`PUBLISHED`), soldCount, metaTitle, metaDescription, createdAt, updatedAt |
| **ProductImage** | id, productId, url, alt, sortOrder |
| **ProductCategory** | productId, categoryId |
| **Cart / CartItem** | cart: id, userId / sessionId; item: cartId, productId, quantity |
| **Order** | id, code (unik), userId, status, paymentMethod (`TRANSFER`/`COD`), subtotal, shippingCost, total, data penerima & alamat (snapshot), courier, trackingNumber, note, paymentDueAt, createdAt |
| **OrderItem** | id, orderId, productId, productName, price, quantity (snapshot) |
| **OrderStatusLog** | id, orderId, fromStatus, toStatus, byUserId, note, createdAt |
| **PaymentConfirmation** | id, orderId, proofUrl, senderName, senderBank, status (`PENDING`/`APPROVED`/`REJECTED`), reviewedBy, createdAt |
| **Review** | id, productId, userId, rating (1–5), comment, status, createdAt |
| **Banner** | id, imageDesktop, imageMobile, link, sortOrder, isActive |
| **Setting** | key, value (JSON) — info toko, rekening, ongkir, COD, dll. |
| **ShippingRate** | id, region, cost |
| **ContactMessage** | id, name, email, phone, message, isRead, createdAt |
| **NewsletterSubscriber** | id, email (unik), createdAt |

---

## 10. Struktur Halaman (Route)

**Storefront**
| Route | Halaman |
|---|---|
| `/` | Beranda |
| `/shop` | Semua produk |
| `/kategori/[slug]` | Produk per kategori |
| `/produk/[slug]` | Detail produk |
| `/cari` | Hasil pencarian |
| `/keranjang` | Keranjang |
| `/checkout` | Checkout |
| `/pesanan/[kode]` | Status pesanan & konfirmasi pembayaran |
| `/akun`, `/akun/pesanan`, `/akun/alamat`, `/akun/profil` | Akun pelanggan |
| `/masuk`, `/daftar`, `/lupa-password` | Autentikasi |
| `/tentang`, `/kontak`, `/kebijakan-privasi`, `/syarat-ketentuan` | Halaman informasi |

**Admin**
| Route | Halaman |
|---|---|
| `/admin` | Dashboard |
| `/admin/produk`, `/admin/produk/baru`, `/admin/produk/[id]`, `/admin/produk/import` | Produk |
| `/admin/kategori` | Kategori |
| `/admin/pesanan`, `/admin/pesanan/[id]` | Pesanan |
| `/admin/pelanggan`, `/admin/ulasan`, `/admin/pesan`, `/admin/newsletter` | Pelanggan & interaksi |
| `/admin/banner`, `/admin/konten` | Konten |
| `/admin/pengaturan`, `/admin/pengguna` | Pengaturan & user admin |

---

## 11. Milestone

| Tahap | Cakupan | Hasil |
|---|---|---|
| **M1 — Fondasi & Admin Produk** | Setup project, database & Prisma, auth admin, CRUD produk & kategori, upload gambar | Admin sudah bisa input produk |
| **M2 — Storefront Katalog** | Layout & desain, beranda, toko, kategori, pencarian, detail produk, quick view, tombol WhatsApp | Katalog bisa dilihat publik |
| **M3 — Transaksi** | Akun pelanggan, keranjang, checkout, ongkir, transfer/COD, konfirmasi pembayaran, manajemen pesanan, email notifikasi | Pesanan end-to-end berjalan |
| **M4 — Konten, SEO & Go-live** | Banner & pengaturan, ulasan, kontak, newsletter, import/export CSV & migrasi data, SEO, uji performa, UAT bersama klien, deploy | Situs siap live |

---

## 12. Asumsi & Pertanyaan Terbuka untuk Klien

1. **Ongkir**: cukup tarif flat / per wilayah yang diatur manual, atau perlu cek ongkir otomatis per kurir (RajaOngkir, biaya tambahan)?
2. **Obat wajib resep**: boleh dijual online? Jika ya, apakah perlu upload resep saat checkout (saat ini di luar MVP)?
3. **Migrasi data**: apakah ada akses ke data produk lama (export WooCommerce/CSV/Excel) beserta foto produk?
4. **Domain & hosting**: memakai domain yang sudah ada atau domain baru? Siapa yang menanggung biaya hosting, database, dan storage?
5. **Notifikasi pesanan ke admin**: cukup email, atau perlu WhatsApp otomatis (butuh layanan WhatsApp API berbayar)?
6. **Branding**: sama dengan amanfarma (nama, logo, warna) atau identitas baru milik klien? Mohon siapkan logo & aset brand.
7. **Integrasi marketplace**: cukup link ke toko Tokopedia/Shopee seperti referensi?
8. **Jumlah akun admin/staf** yang dibutuhkan dan pembagian aksesnya.
9. **Jam operasional & SLA pengiriman** yang ingin ditampilkan.

> Asumsi hingga dijawab: ongkir flat/per wilayah manual, obat wajib resep hanya diberi label (pembelian dikonfirmasi admin via WhatsApp), notifikasi admin via email, dan link marketplace statis.
