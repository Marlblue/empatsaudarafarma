import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export const PER_PAGE = 12;

export const SORT_OPTIONS = {
  popular: "Urutkan menurut popularitas",
  rating: "Urutkan menurut rata-rata rating",
  newest: "Urutkan menurut yang terbaru",
  "price-asc": "Urutkan menurut harga: rendah ke tinggi",
  "price-desc": "Urutkan menurut harga: tinggi ke rendah",
} as const;

export type SortKey = keyof typeof SORT_OPTIONS;

export const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  compareAtPrice: true,
  stock: true,
  trackStock: true,
  shortDescription: true,
  requiresPrescription: true,
  images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true, alt: true } },
  categories: { take: 1, select: { category: { select: { name: true, slug: true } } } },
} satisfies Prisma.ProductSelect;

export type ProductCardData = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

const ORDER_BY: Record<SortKey, Prisma.ProductOrderByWithRelationInput[]> = {
  popular: [{ soldCount: "desc" }, { createdAt: "desc" }],
  rating: [{ reviews: { _count: "desc" } }, { soldCount: "desc" }],
  newest: [{ createdAt: "desc" }],
  "price-asc": [{ price: "asc" }],
  "price-desc": [{ price: "desc" }],
};

export function parseSort(value: string | undefined): SortKey {
  return value && value in SORT_OPTIONS ? (value as SortKey) : "newest";
}

export function searchWhere(q: string): Prisma.ProductWhereInput {
  const contains = { contains: q, mode: "insensitive" as const };
  return {
    OR: [
      { name: contains },
      { activeIngredient: contains },
      { manufacturer: contains },
      { sku: contains },
    ],
  };
}

export async function listProducts(opts: {
  categoryIds?: string[];
  q?: string;
  sort?: SortKey;
  page?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}) {
  const page = Math.max(1, opts.page ?? 1);
  const where: Prisma.ProductWhereInput = {
    status: "PUBLISHED",
    ...(opts.categoryIds && { categories: { some: { categoryId: { in: opts.categoryIds } } } }),
    ...(opts.q && searchWhere(opts.q)),
    ...((opts.minPrice || opts.maxPrice) && {
      price: {
        ...(opts.minPrice ? { gte: opts.minPrice } : {}),
        ...(opts.maxPrice ? { lte: opts.maxPrice } : {}),
      },
    }),
    ...(opts.inStock && { OR: [{ trackStock: false }, { stock: { gt: 0 } }] }),
  };
  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: ORDER_BY[opts.sort ?? "newest"],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: productCardSelect,
    }),
  ]);
  return { total, products, page, totalPages: Math.max(1, Math.ceil(total / PER_PAGE)) };
}

export async function homeSections() {
  const base = { status: "PUBLISHED" as const };
  const [featured, bestSellers, newest] = await Promise.all([
    db.product.findMany({
      where: { ...base, isFeatured: true },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: productCardSelect,
    }),
    db.product.findMany({
      where: base,
      orderBy: [{ isBestSeller: "desc" }, { soldCount: "desc" }],
      take: 10,
      select: productCardSelect,
    }),
    db.product.findMany({
      where: base,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: productCardSelect,
    }),
  ]);
  return { featured, bestSellers, newest };
}

/** Semua kategori sebagai pohon induk → anak, sudah terurut */
export const getCategoryTree = cache(async () => {
  const all = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  const roots = all.filter((c) => !c.parentId);
  return roots.map((root) => ({
    ...root,
    children: all.filter((c) => c.parentId === root.id),
  }));
});

export async function getProductBySlug(slug: string, includeDraft = false) {
  return db.product.findFirst({
    where: { slug, ...(includeDraft ? {} : { status: "PUBLISHED" as const }) },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      categories: { include: { category: true } },
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  });
}

export async function getRelatedProducts(productId: string, categoryIds: string[]) {
  if (categoryIds.length === 0) return [];
  return db.product.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: productId },
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    orderBy: { soldCount: "desc" },
    take: 5,
    select: productCardSelect,
  });
}

export function isInStock(p: { trackStock: boolean; stock: number }) {
  return !p.trackStock || p.stock > 0;
}
