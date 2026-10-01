import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

// Daftar produk berubah setiap kali admin mengelola produk
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  const [products, categories] = await Promise.all([
    db.product.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }),
    db.category.findMany({ select: { slug: true } }),
  ]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...["tentang", "kontak", "cara-belanja", "kebijakan-privasi", "syarat-ketentuan"].map((p) => ({
      url: `${base}/${p}`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
    ...categories.map((c) => ({ url: `${base}/kategori/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/produk/${p.slug}`, lastModified: p.updatedAt, priority: 0.8 })),
  ];
}
