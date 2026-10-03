/**
 * Ubah foto produk JPG/PNG di uploads/products menjadi WebP (file asli tidak dihapus), lalu siapkan:
 *   deploy/foto-webp.zip  → ekstrak ke folder UPLOAD_DIR di server (berisi products/*.webp)
 *   deploy/foto-webp.sql  → ganti URL gambar di database (satu UPDATE per file, aman diulang)
 *
 *   pnpm images:webp            (butuh Google Chrome; atur CHROME_PATH bila lokasinya berbeda)
 *   pnpm images:webp --apply    sekaligus jalankan SQL-nya ke database lokal
 */
import "dotenv/config";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import pg from "pg";

const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR ?? "uploads");
const SRC = path.join(UPLOAD_ROOT, "products");
const OUT = path.resolve("deploy");
const STAGE = path.join(OUT, "foto-webp");
const QUALITY = 0.82;
const MAX_SIZE = 1600;

const sources = readdirSync(SRC).filter((f) => /\.(jpe?g|png)$/i.test(f));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const page = await browser.newPage();

rmSync(STAGE, { recursive: true, force: true });
mkdirSync(path.join(STAGE, "products"), { recursive: true });

const updates = [];
let before = 0;
let after = 0;
for (const file of sources) {
  const webpName = file.replace(/\.(jpe?g|png)$/i, ".webp");
  const target = path.join(SRC, webpName);
  if (!existsSync(target)) {
    const buf = readFileSync(path.join(SRC, file));
    const mime = /\.png$/i.test(file) ? "image/png" : "image/jpeg";
    const data = await page.evaluate(
      async ({ src, quality, maxSize }) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
        const c = new OffscreenCanvas(Math.round(img.naturalWidth * scale), Math.round(img.naturalHeight * scale));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        const u = new Uint8Array(await (await c.convertToBlob({ type: "image/webp", quality })).arrayBuffer());
        let s = "";
        for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192));
        return btoa(s);
      },
      { src: `data:${mime};base64,${buf.toString("base64")}`, quality: QUALITY, maxSize: MAX_SIZE },
    );
    writeFileSync(target, Buffer.from(data, "base64"));
  }
  before += readFileSync(path.join(SRC, file)).length;
  after += readFileSync(target).length;
  writeFileSync(path.join(STAGE, "products", webpName), readFileSync(target));
  const from = `/uploads/products/${file}`.replace(/'/g, "''");
  const to = `/uploads/products/${webpName}`.replace(/'/g, "''");
  updates.push(`UPDATE "ProductImage" SET url = '${to}' WHERE url = '${from}';`);
}
await browser.close();

const sql = ["BEGIN;", ...updates, "COMMIT;", ""].join("\n");
writeFileSync(path.join(OUT, "foto-webp.sql"), sql);

const zip = path.join(OUT, "foto-webp.zip");
rmSync(zip, { force: true });
const tar = process.platform === "win32" ? path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe") : "zip";
execFileSync(tar, process.platform === "win32" ? ["-a", "-c", "-f", zip, "products"] : ["-qr", zip, "products"], { cwd: STAGE });
rmSync(STAGE, { recursive: true, force: true });

const kb = (n) => `${Math.round(n / 1024)} KB`;
console.log(`${sources.length} foto: ${kb(before)} → ${kb(after)} (hemat ${Math.round((1 - after / before) * 100)}%)`);
console.log(`Paket: ${zip}\nSQL:   ${path.join(OUT, "foto-webp.sql")}`);

if (process.argv.includes("--apply")) {
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  await db.query(sql);
  await db.end();
  console.log("SQL diterapkan ke database lokal.");
}
