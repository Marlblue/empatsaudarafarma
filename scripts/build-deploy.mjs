/**
 * Susun paket upload untuk cPanel "Setup Node.js App" dari hasil `next build` (output: "standalone").
 *
 *   pnpm build && pnpm deploy:pack            (paket zip untuk upload manual)
 *   node scripts/build-deploy.mjs --no-zip     (folder deploy/app saja, dipakai GitHub Actions)
 *
 * Hasil di folder deploy/:
 *   app.zip       → ekstrak ke folder aplikasi (Application root), startup file: server.js
 *   uploads.zip   → ekstrak ke folder UPLOAD_DIR di server (foto produk)
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "deploy");
const APP = path.join(OUT, "app");
const STANDALONE = path.join(ROOT, ".next", "standalone");
const NO_ZIP = process.argv.includes("--no-zip");

if (!existsSync(path.join(STANDALONE, "server.js"))) {
  console.error("Belum ada .next/standalone/server.js — jalankan `pnpm build` dulu.");
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// dereference: symlink buatan pnpm/Turbopack (path absolut Windows) disalin sebagai file biasa
cpSync(STANDALONE, APP, { recursive: true, dereference: true });
cpSync(path.join(ROOT, ".next", "static"), path.join(APP, ".next", "static"), { recursive: true });
cpSync(path.join(ROOT, "public"), path.join(APP, "public"), { recursive: true });

// sharp tidak dipakai (images.unoptimized) dan binary-nya khusus Windows
for (const dir of ["node_modules/sharp", "node_modules/@img"]) rmSync(path.join(APP, dir), { recursive: true, force: true });
// .env lokal tidak boleh ikut; variabel lingkungan diisi lewat cPanel
rmSync(path.join(APP, ".env"), { force: true });

// Passenger (cPanel) me-restart aplikasi setiap kali tmp/restart.txt berubah
mkdirSync(path.join(APP, "tmp"), { recursive: true });
writeFileSync(path.join(APP, "tmp", "restart.txt"), `${new Date().toISOString()}
`);

writeFileSync(
  path.join(APP, "README-DEPLOY.txt"),
  [
    "Startup file: server.js",
    "Environment variables (isi di Setup Node.js App):",
    "  DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/NAMA_DB",
    "  UPLOAD_DIR=/home/USERCPANEL/uploads",
    "  SITE_URL=https://empatsaudarafarma.com",
    "  NODE_ENV=production",
    "",
  ].join("\n"),
);

function zip(cwd, target, entries) {
  if (process.platform === "win32") {
    // bsdtar bawaan Windows (bukan GNU tar dari Git Bash) bisa membuat .zip
    const tar = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe");
    execFileSync(tar, ["-a", "-c", "-f", target, ...entries], { cwd, stdio: "inherit" });
  } else {
    execFileSync("zip", ["-qr", target, ...entries], { cwd, stdio: "inherit" });
  }
}

if (!NO_ZIP) {
  zip(APP, path.join(OUT, "app.zip"), ["."]);
  const uploads = path.resolve(process.env.UPLOAD_DIR ?? "uploads");
  if (existsSync(path.join(uploads, "products"))) zip(uploads, path.join(OUT, "uploads.zip"), ["products"]);
}

console.log(`Selesai. Paket ada di ${OUT}`);
