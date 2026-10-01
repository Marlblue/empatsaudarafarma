/**
 * Ganti watermark "AF APOTIK AMAN FARMA" pada foto produk hasil import dengan logo toko
 * (public/images/site/logo.png). Foto asli disalin ke uploads/products-original/ sekali.
 *
 *   pnpm watermark            (butuh Google Chrome; atur CHROME_PATH bila lokasinya berbeda)
 */
import { chromium } from "playwright-core";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
const DST = "uploads/products/";
const SRC = "uploads/products-original/";
// Simpan salinan asli setiap foto sebelum diubah (foto baru dari import ikut dicadangkan)
mkdirSync(SRC, { recursive: true });
for (const f of readdirSync(DST)) if (!existsSync(SRC + f)) copyFileSync(DST + f, SRC + f);
const only = process.argv[2]; // opsional: pola nama file untuk uji
const logo = "data:image/png;base64," + readFileSync("public/images/site/logo.png").toString("base64");
const files = readdirSync(DST).filter((f) => !only || f.includes(only));
const b = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
const p = await b.newPage();
await p.evaluate(async (logo) => { const i = new Image(); i.src = logo; await i.decode(); window.__logo = i; }, logo);
let done = 0, skipped = [];
for (const f of files) {
  const buf = readFileSync(SRC + f);
  const mime = f.endsWith(".png") ? "image/png" : f.endsWith(".webp") ? "image/webp" : "image/jpeg";
  const res = await p.evaluate(async ({ src, mime }) => {
    const img = new Image(); img.src = src; await img.decode();
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = new OffscreenCanvas(W, H); const x = c.getContext("2d"); x.drawImage(img, 0, 0);
    const x0 = Math.floor(W * 0.582), x1 = Math.ceil(W * 0.899), y0 = Math.floor(H * 0.855), y1 = Math.ceil(H * 0.963);
    const region = x.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    let dark = 0; for (let i = 0; i < region.length; i += 4) if (region[i] < 150 && region[i + 2] > 60) dark++;
    if (dark < (x1 - x0) * (y1 - y0) * 0.01) return { skip: true };
    // Warna latar = median piksel di sekeliling area
    const ring = [];
    const push = (px, py) => { const d = x.getImageData(px, py, 1, 1).data; ring.push(d[0] * 65536 + d[1] * 256 + d[2]); };
    for (let px = x0 - 3; px <= x1 + 3; px += 3) { push(px, y0 - 3); push(px, Math.min(H - 1, y1 + 2)); }
    for (let py = y0; py <= y1; py += 3) { push(x0 - 3, py); push(Math.min(W - 1, x1 + 3), py); }
    ring.sort((a, b) => a - b); const m = ring[Math.floor(ring.length / 2)];
    x.fillStyle = `rgb(${m >> 16},${(m >> 8) & 255},${m & 255})`;
    x.fillRect(x0, y0, x1 - x0, y1 - y0);
    // Logo baru rata kanan di posisi watermark lama
    const L = window.__logo; const bw = W * 0.304, bh = H * 0.095;
    const s = Math.min(bw / L.naturalWidth, bh / L.naturalHeight);
    const lw = L.naturalWidth * s, lh = L.naturalHeight * s;
    x.drawImage(L, W * 0.892 - lw, H * 0.862 + (bh - lh) / 2, lw, lh);
    const bl = await c.convertToBlob({ type: mime, quality: 0.92 });
    const u = new Uint8Array(await bl.arrayBuffer()); let str = ""; for (let i = 0; i < u.length; i += 8192) str += String.fromCharCode(...u.subarray(i, i + 8192));
    return { data: btoa(str) };
  }, { src: `data:${mime};base64,${buf.toString("base64")}`, mime });
  if (res.skip) skipped.push(f); else { writeFileSync(DST + f, Buffer.from(res.data, "base64")); done++; }
}
console.log(`diproses ${done}, dilewati ${skipped.length}`);
if (skipped.length) console.log(skipped.join("\n"));
await b.close();
