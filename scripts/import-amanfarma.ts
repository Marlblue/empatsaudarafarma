/**
 * Import katalog dari amanfarma.com (WooCommerce Store API): kategori, produk, spesifikasi, dan foto.
 * PERINGATAN: menghapus semua produk & kategori yang ada lalu menggantinya.
 * Jalankan lewat `pnpm import:amanfarma` agar watermark AF di foto langsung diganti logo toko.
 *
 *   pnpm tsx scripts/import-amanfarma.ts
 */
import "dotenv/config";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const SOURCE = "https://amanfarma.com/wp-json/wc/store/v1";
const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

type ApiProduct = {
  id: number;
  name: string;
  permalink: string;
  sku: string;
  short_description: string;
  description: string;
  prices: { price: string; regular_price: string; sale_price: string };
  images: { src: string; alt: string }[];
  categories: { slug: string }[];
  is_in_stock: boolean;
};

// Urutan & label mengikuti menu sidebar amanfarma.com
const CATEGORY_MENU: { slug: string; name: string; children?: { slug: string; name: string }[] }[] = [
  { slug: "alat-cek-gula-darah", name: "Alat Cek Gula Darah" },
  { slug: "cairan-infus", name: "Cairan Infus" },
  { slug: "human-albumin", name: "Human Albumin" },
  {
    slug: "injeksi",
    name: "Injeksi",
    children: [
      { slug: "injeksi-perbox", name: "Injeksi Perbox" },
      { slug: "injeksi-satuan", name: "Injeksi Satuan" },
    ],
  },
  { slug: "inhaler", name: "Inhaler" },
  { slug: "insulin-diabetes", name: "Insulin Diabetes" },
  { slug: "untuk-nebulizer", name: "Nebulizer" },
  { slug: "pembersih-luka", name: "Pembersih Luka" },
  { slug: "perlengkapan-infus", name: "Perlengkapan Infus" },
  { slug: "plester-luka", name: "Plester Luka, Perban dan Kassa" },
  { slug: "suppositoria", name: "Suppositoria" },
  { slug: "multivitamin", name: "Multivitamin" },
  { slug: "pampers", name: "Pampers Dewasa" },
  { slug: "obat-generik", name: "Obat Generik" },
  { slug: "salep-kulit-dan-mata", name: "Salep Kulit dan Mata" },
  { slug: "obat-sirup", name: "Obat Sirup" },
];

const SPEC_LABELS = {
  "Nama Produk": "genericName",
  "Bentuk Sediaan": "dosageForm",
  Komposisi: "activeIngredient",
  Merk: "brand",
  Kemasan: "packaging",
  Pendaftar: "registrant",
  "Diproduksi Oleh": "manufacturer",
} as const;
type SpecField = (typeof SPEC_LABELS)[keyof typeof SPEC_LABELS];

function decode(s: string) {
  return s
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function htmlToLines(html: string) {
  return decode(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(div|p|li|tr|h\d)>/gi, "\n")
      .replace(/<\/t[dh]>/gi, " ")
      .replace(/<[^>]+>/g, ""),
  )
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function cleanValue(v: string) {
  const cleaned = v
    .replace(/^[\s:;–-]+/, "")
    .replace(/(\s*–)+\s*$/, "")
    .replace(/;\s*$/, "")
    .trim();
  return cleaned && cleaned !== "–" ? cleaned : null;
}

/** Pisahkan tabel spesifikasi dari teks bebas di short_description */
function parseSpecs(html: string) {
  const lines = htmlToLines(html);
  const specs: Partial<Record<SpecField, string>> = {};
  const rest: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const label = (Object.keys(SPEC_LABELS) as (keyof typeof SPEC_LABELS)[]).find(
      (l) => line === l || line.startsWith(`${l} `) || line.startsWith(`${l}:`),
    );
    if (!label) {
      rest.push(line);
      continue;
    }
    let value = line.slice(label.length);
    // Nilai di baris berikutnya bila baris label kosong
    if (!cleanValue(value) && value.trim() === "" && lines[i + 1] && !Object.keys(SPEC_LABELS).some((l) => lines[i + 1].startsWith(l))) {
      value = lines[++i];
    }
    const v = cleanValue(value);
    if (v) specs[SPEC_LABELS[label]] = v;
  }
  // Buang tautan "Checkout Produk di:" ke marketplace
  const description = rest
    .filter((l) => !/^Checkout Produk di/i.test(l) && !/^https?:\/\//.test(l) && /[\p{L}\p{N}]/u.test(l))
    .map((l) => (l.startsWith("– ") || l.startsWith("* ") ? `- ${l.slice(2)}` : l))
    .join("\n")
    .trim();
  return { specs, description: description || null };
}

async function fetchAll(): Promise<ApiProduct[]> {
  const all: ApiProduct[] = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${SOURCE}/products?per_page=100&page=${page}`);
    if (!res.ok) throw new Error(`Gagal mengambil halaman ${page}: ${res.status}`);
    const batch = (await res.json()) as ApiProduct[];
    all.push(...batch);
    console.log(`  halaman ${page}: ${batch.length} produk`);
    if (batch.length < 100) return all;
  }
}

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

async function download(url: string, slug: string, index: number) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const type = res.headers.get("content-type")?.split(";")[0] ?? "";
      const ext = EXT[type] ?? path.extname(new URL(url).pathname).slice(1).toLowerCase() ?? "jpg";
      const name = `${slug.slice(0, 60)}-${index + 1}-${randomUUID().slice(0, 8)}.${ext}`;
      await writeFile(path.join(UPLOAD_ROOT, "products", name), Buffer.from(await res.arrayBuffer()));
      return `/uploads/products/${name}`;
    } catch (e) {
      if (attempt === 3) throw e;
    }
  }
  throw new Error("unreachable");
}

/** Jalankan fungsi async dengan batas paralel */
async function pool<T>(items: T[], limit: number, fn: (item: T, i: number) => Promise<void>) {
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const i = next++;
        await fn(items[i], i);
      }
    }),
  );
}

async function main() {
  console.log("Mengambil produk dari amanfarma.com...");
  const products = await fetchAll();
  console.log(`Total ${products.length} produk.`);

  console.log("Mengosongkan katalog lama...");
  await db.cartItem.deleteMany();
  await db.product.deleteMany();
  await db.category.deleteMany();

  const categoryIds = new Map<string, string>();
  for (const [i, c] of CATEGORY_MENU.entries()) {
    const parent = await db.category.create({ data: { name: c.name, slug: c.slug, sortOrder: i } });
    categoryIds.set(c.slug, parent.id);
    for (const [j, child] of (c.children ?? []).entries()) {
      const created = await db.category.create({
        data: { name: child.name, slug: child.slug, sortOrder: j, parentId: parent.id },
      });
      categoryIds.set(child.slug, created.id);
    }
  }

  await mkdir(path.join(UPLOAD_ROOT, "products"), { recursive: true });
  const now = Date.now();
  let done = 0;
  const failures: string[] = [];

  await pool(products, 8, async (p, index) => {
    const slug = decodeURIComponent(new URL(p.permalink).pathname.split("/").filter(Boolean).pop() ?? String(p.id));
    const { specs, description } = parseSpecs(p.short_description);
    const price = Number(p.prices.price) || 0;
    const regular = Number(p.prices.regular_price) || 0;
    const images: string[] = [];
    for (const [i, img] of p.images.entries()) {
      try {
        images.push(await download(img.src, slug, i));
      } catch (e) {
        failures.push(`${p.name}: ${img.src} (${(e as Error).message})`);
      }
    }
    const cats = p.categories.map((c) => categoryIds.get(c.slug)).filter((id): id is string => !!id);
    await db.product.create({
      data: {
        name: decode(p.name),
        slug,
        sku: p.sku || null,
        price,
        compareAtPrice: regular > price ? regular : null,
        stock: 0,
        trackStock: !p.is_in_stock, // stok asli tidak tersedia di API: produk tersedia dibuat tanpa pelacakan stok
        ...specs,
        description,
        status: "PUBLISHED",
        // Pertahankan urutan "terbaru" dari situs asal
        createdAt: new Date(now - index * 60_000),
        categories: { create: cats.map((categoryId) => ({ categoryId })) },
        images: { create: images.map((url, i) => ({ url, alt: decode(p.name), sortOrder: i })) },
      },
    });
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${products.length} produk diimpor`);
  });

  console.log(`Selesai: ${done} produk, ${categoryIds.size} kategori.`);
  if (failures.length) console.log(`Gagal mengunduh ${failures.length} gambar:\n${failures.join("\n")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
