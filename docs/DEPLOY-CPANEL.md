# Deploy ke cPanel (DomaiNesia) — Setup Node.js App

Aplikasi di-build di laptop lalu di-upload; server cukup menjalankan `server.js` (tidak perlu `npm install` atau build di server).

## 1. Siapkan paket di laptop

```
pnpm build
pnpm deploy:pack     # → deploy/app.zip, deploy/uploads.zip
DB_APP_USER=empatsau_app pnpm db:export   # → deploy/database.sql (struktur + data + akses user aplikasi)
```

`pnpm db:start` harus sedang jalan saat `db:export`.

## 2. SSL dulu

cPanel → **Lets Encrypt** → pasang untuk `empatsaudarafarma.com` dan `www`. Lalu aktifkan **Force to HTTPS**.
Login (admin & pelanggan) memakai cookie `secure`, jadi tanpa HTTPS tidak bisa login.

## 3. Database PostgreSQL

1. cPanel → **PostgreSQL Databases**: buat database (mis. `empatsau_farma`) dan user (mis. `empatsau_app`) dengan password kuat, lalu **Add User to Database** dengan semua hak akses.
2. cPanel → **phpPgAdmin** → pilih database tadi → **SQL** → upload `deploy/database.sql` → Execute.
   File dibungkus `BEGIN/COMMIT`: kalau ada error, tidak ada yang setengah masuk; kirim pesan error-nya.

## 4. Foto produk

File Manager → buat folder `/home/empatsau/uploads` (di luar `public_html`) → upload `deploy/uploads.zip` ke folder itu → **Extract**.
Hasilnya harus `/home/empatsau/uploads/products/*.jpg`.

## 5. Aplikasi Node.js

1. cPanel → **Setup Node.js App** → **Create Application**:
   - Node.js version: versi tertinggi yang ada (minimal **20.9**)
   - Application mode: **Production**
   - Application root: `empatsaudarafarma`
   - Application URL: `empatsaudarafarma.com`
   - Application startup file: `server.js`
2. Tambahkan **Environment variables**:

   | Nama | Nilai |
   | --- | --- |
   | `DATABASE_URL` | `postgresql://empatsau_app:PASSWORD@localhost:5432/empatsau_farma` |
   | `UPLOAD_DIR` | `/home/empatsau/uploads` |
   | `SITE_URL` | `https://empatsaudarafarma.com` |
   | `NODE_ENV` | `production` |

   Password yang mengandung karakter khusus (`@ : / ? #`) harus di-URL-encode, mis. `@` → `%40`.
3. **Create**, lalu File Manager → buka `/home/empatsau/empatsaudarafarma` → hapus isi bawaan → upload `deploy/app.zip` → **Extract** (pastikan `server.js` ada langsung di folder itu, bukan di subfolder).
4. Kembali ke Setup Node.js App → **Restart**. Jangan klik "Run NPM Install" (semua dependensi sudah ada di paket).
5. Kalau domain masih menampilkan halaman default hosting, hapus `index.html`/`default.html` bawaan di `public_html`.

## 6. Setelah online

- Login `https://empatsaudarafarma.com/admin` (`admin@farma.local` / `admin12345`) → **segera ganti password** di menu Pengguna Admin.
- Lengkapi Admin → Pengaturan: email, link Tokopedia/Shopee, No. Izin Apotek & SIPA.

## Update berikutnya

Kode saja: `pnpm build && pnpm deploy:pack` → upload & extract `app.zip` (timpa) → Restart. Database dan folder uploads tidak tersentuh.
Bila ada migrasi baru di `prisma/migrations`, jalankan SQL migrasi tersebut lewat phpPgAdmin sebelum restart.

## Auto-deploy dari GitHub (push ke `main`)

Workflow [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) mem-build aplikasi di GitHub Actions lalu meng-upload `deploy/app/` ke server lewat FTPS (lftp, 10 file paralel; aset statis dulu, restart terakhir). Pull request hanya di-build untuk memastikan tidak rusak.

Sekali saja:

1. cPanel → **FTP Accounts** → buat akun, mis. `deploy`, dengan **Directory** `/home/empatsau/empatsaudarafarma` (hanya folder aplikasi).
2. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

   | Secret | Nilai |
   | --- | --- |
   | `FTP_SERVER` | `empatsaudarafarma.com` |
   | `FTP_USERNAME` | `deploy@empatsaudarafarma.com` |
   | `FTP_PASSWORD` | password akun FTP |
   | `FTP_SERVER_DIR` | `./` |

Alur kerja: buat branch → push → buka Pull Request (Actions mengecek build) → merge ke `main` → otomatis ter-deploy dan aplikasi restart sendiri (`tmp/restart.txt`).

Yang tetap manual:
- Perubahan struktur database (migrasi baru di `prisma/migrations`): jalankan `migration.sql`-nya lewat phpPgAdmin **sebelum** merge.
- Environment variable baru: tambahkan di Setup Node.js App.
