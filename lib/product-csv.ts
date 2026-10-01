import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseCsv } from "@/lib/csv";
import { slugify } from "@/lib/format";
import { saveUploadFromUrl } from "@/lib/storage";

export const PRODUCT_CSV_COLUMNS = [
  "sku",
  "name",
  "slug",
  "price",
  "compare_at_price",
  "stock",
  "track_stock",
  "weight_gram",
  "categories",
  "generic_name",
  "active_ingredient",
  "brand",
  "registrant",
  "dosage_form",
  "packaging",
  "manufacturer",
  "bpom_number",
  "short_description",
  "description",
  "requires_prescription",
  "featured",
  "best_seller",
  "status",
  "image_urls",
] as const;

const bool = z
  .string()
  .optional()
  .transform((v) => ["1", "ya", "yes", "true", "y"].includes((v ?? "").trim().toLowerCase()));
const text = z
  .string()
  .optional()
  .transform((v) => v?.trim() || null);
const rupiah = z
  .string()
  .optional()
  .transform((v) => (v ?? "").replace(/[^\d]/g, ""))
  .transform((v) => (v === "" ? null : Number(v)));

const rowSchema = z.object({
  sku: text,
  name: z.string().trim().min(2, "kolom name wajib diisi"),
  slug: text,
  price: rupiah.refine((v) => v !== null, "kolom price wajib diisi"),
  compare_at_price: rupiah,
  stock: rupiah,
  track_stock: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? ["1", "ya", "yes", "true", "y"].includes(v.trim().toLowerCase()) : true)),
  weight_gram: rupiah,
  categories: text,
  generic_name: text,
  active_ingredient: text,
  brand: text,
  registrant: text,
  dosage_form: text,
  packaging: text,
  manufacturer: text,
  bpom_number: text,
  short_description: text,
  description: text,
  requires_prescription: bool,
  featured: bool,
  best_seller: bool,
  status: z
    .string()
    .optional()
    .transform((v) => (["draft", "DRAFT"].includes((v ?? "").trim()) ? ("DRAFT" as const) : ("PUBLISHED" as const))),
  image_urls: text,
});

export type ImportResult = { created: number; updated: number; errors: { row: number; message: string }[] };

async function resolveCategoryIds(names: string | null, cache: Map<string, string>) {
  if (!names) return [];
  const ids: string[] = [];
  for (const raw of names.split("|").map((s) => s.trim()).filter(Boolean)) {
    const slug = slugify(raw);
    let id = cache.get(slug);
    if (!id) {
      const cat = await db.category.upsert({ where: { slug }, create: { name: raw, slug }, update: {} });
      id = cat.id;
      cache.set(slug, id);
    }
    ids.push(id);
  }
  return ids;
}

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base) || "produk";
  let slug = root;
  for (let i = 2; ; i++) {
    const existing = await db.product.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${root}-${i}`;
  }
}

/**
 * Import produk dari CSV. Baris dengan SKU yang sudah ada akan diperbarui (mode update),
 * selain itu dibuat produk baru. Kategori yang belum ada dibuat otomatis.
 */
export async function importProductsCsv(content: string, mode: "upsert" | "create"): Promise<ImportResult> {
  const rows = parseCsv(content);
  const result: ImportResult = { created: 0, updated: 0, errors: [] };
  if (rows.length < 2) {
    result.errors.push({ row: 1, message: "File kosong atau tidak memiliki baris data." });
    return result;
  }
  const header = rows[0].map((h) => h.trim().toLowerCase());
  if (!header.includes("name") || !header.includes("price")) {
    result.errors.push({ row: 1, message: "Header wajib memuat kolom name dan price. Gunakan template yang disediakan." });
    return result;
  }

  const categoryCache = new Map<string, string>();
  for (const [index, cells] of rows.slice(1).entries()) {
    const rowNumber = index + 2;
    const record = Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
    const parsed = rowSchema.safeParse(record);
    if (!parsed.success) {
      result.errors.push({ row: rowNumber, message: parsed.error.issues.map((i) => i.message).join("; ") });
      continue;
    }
    const r = parsed.data;
    try {
      const existing = r.sku ? await db.product.findUnique({ where: { sku: r.sku }, select: { id: true } }) : null;
      if (existing && mode === "create") {
        result.errors.push({ row: rowNumber, message: `SKU ${r.sku} sudah ada (dilewati)` });
        continue;
      }
      const categoryIds = await resolveCategoryIds(r.categories, categoryCache);
      const data = {
        name: r.name,
        sku: r.sku,
        price: r.price!,
        compareAtPrice: r.compare_at_price && r.compare_at_price > r.price! ? r.compare_at_price : null,
        stock: r.stock ?? 0,
        trackStock: r.track_stock,
        weightGram: r.weight_gram ?? 0,
        genericName: r.generic_name,
        activeIngredient: r.active_ingredient,
        brand: r.brand,
        registrant: r.registrant,
        dosageForm: r.dosage_form,
        packaging: r.packaging,
        manufacturer: r.manufacturer,
        bpomNumber: r.bpom_number,
        shortDescription: r.short_description,
        description: r.description,
        requiresPrescription: r.requires_prescription,
        isFeatured: r.featured,
        isBestSeller: r.best_seller,
        status: r.status,
      };

      let productId: string;
      if (existing) {
        productId = existing.id;
        await db.product.update({
          where: { id: productId },
          data: { ...data, ...(r.slug && { slug: await uniqueSlug(r.slug, productId) }) },
        });
        if (categoryIds.length) {
          await db.productCategory.deleteMany({ where: { productId } });
          await db.productCategory.createMany({ data: categoryIds.map((categoryId) => ({ productId, categoryId })) });
        }
        result.updated++;
      } else {
        const created = await db.product.create({
          data: {
            ...data,
            slug: await uniqueSlug(r.slug ?? r.name),
            categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
          },
        });
        productId = created.id;
        result.created++;
      }

      // Unduh gambar hanya bila produk belum punya gambar, agar import ulang tidak menggandakan gambar
      if (r.image_urls && (await db.productImage.count({ where: { productId } })) === 0) {
        const urls = r.image_urls.split("|").map((u) => u.trim()).filter((u) => /^https?:\/\//.test(u));
        for (const [i, url] of urls.entries()) {
          try {
            const saved = await saveUploadFromUrl(url, "products");
            await db.productImage.create({ data: { productId, url: saved, alt: r.name, sortOrder: i } });
          } catch (e) {
            result.errors.push({ row: rowNumber, message: `Gambar gagal diunduh (${url}): ${(e as Error).message}` });
          }
        }
      }
    } catch (e) {
      result.errors.push({ row: rowNumber, message: (e as Error).message });
    }
  }
  return result;
}
