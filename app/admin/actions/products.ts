"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { deleteUpload, isUploadedFile, saveUpload } from "@/lib/storage";

export type ProductFormState = { error?: string; fieldErrors?: Record<string, string[]> } | null;

const optionalText = z
  .string()
  .trim()
  .max(5000)
  .optional()
  .transform((v) => v || null);

const optionalInt = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? Number(v) : null))
  .pipe(z.number().int().min(0).nullable());

const productSchema = z
  .object({
    name: z.string().trim().min(2, "Nama produk wajib diisi").max(200),
    slug: z.string().trim().max(100).optional(),
    sku: optionalText,
    price: z.coerce.number({ message: "Harga wajib diisi" }).int().min(0, "Harga tidak valid"),
    compareAtPrice: optionalInt,
    stock: z.coerce.number().int().min(0, "Stok tidak valid").default(0),
    trackStock: z.string().optional(),
    weightGram: z.coerce.number().int().min(0).default(0),
    genericName: optionalText,
    activeIngredient: optionalText,
    brand: optionalText,
    registrant: optionalText,
    dosageForm: optionalText,
    packaging: optionalText,
    manufacturer: optionalText,
    bpomNumber: optionalText,
    shortDescription: optionalText,
    description: z.string().trim().max(20000).optional().transform((v) => v || null),
    requiresPrescription: z.string().optional(),
    isFeatured: z.string().optional(),
    isBestSeller: z.string().optional(),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    metaTitle: optionalText,
    metaDescription: optionalText,
  })
  .refine((d) => d.compareAtPrice === null || d.compareAtPrice > d.price, {
    message: "Harga coret harus lebih besar dari harga jual",
    path: ["compareAtPrice"],
  });

/** Hapus file gambar yang sudah tidak dipakai produk mana pun (duplikat produk berbagi file) */
async function deleteUnusedImages(urls: string[]) {
  for (const url of new Set(urls)) {
    if ((await db.productImage.count({ where: { url } })) === 0) await deleteUpload(url);
  }
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

export async function saveProduct(
  productId: string | null,
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await requireStaff();
  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string"),
  ) as Record<string, string>;
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { slug: slugInput, trackStock, requiresPrescription, isFeatured, isBestSeller, ...rest } = parsed.data;

  if (rest.sku) {
    const dup = await db.product.findUnique({ where: { sku: rest.sku }, select: { id: true } });
    if (dup && dup.id !== productId) return { fieldErrors: { sku: ["SKU sudah dipakai produk lain"] } };
  }
  if (slugInput) {
    const dup = await db.product.findUnique({ where: { slug: slugify(slugInput) }, select: { id: true } });
    if (dup && dup.id !== productId) return { fieldErrors: { slug: ["Slug sudah dipakai produk lain"] } };
  }

  const categoryIds = formData.getAll("categoryIds").map(String).filter(Boolean);
  const keptImageIds = formData.getAll("keepImageIds").map(String);
  const newFiles = formData.getAll("newImages").filter(isUploadedFile);

  // Simpan gambar baru lebih dulu agar error tipe/ukuran file terlihat sebelum data diubah
  let newUrls: string[];
  try {
    newUrls = await Promise.all(newFiles.map((f) => saveUpload(f, "products")));
  } catch (e) {
    return { error: (e as Error).message };
  }

  const data = {
    ...rest,
    slug: slugInput ? slugify(slugInput) : await uniqueSlug(rest.name, productId ?? undefined),
    trackStock: trackStock === "on",
    requiresPrescription: requiresPrescription === "on",
    isFeatured: isFeatured === "on",
    isBestSeller: isBestSeller === "on",
  };

  let id = productId;
  let removedUrls: string[] = [];
  await db.$transaction(async (tx) => {
    if (id) {
      const current = await tx.productImage.findMany({ where: { productId: id } });
      const removed = current.filter((img) => !keptImageIds.includes(img.id));
      removedUrls = removed.map((img) => img.url);
      await tx.productImage.deleteMany({ where: { id: { in: removed.map((r) => r.id) } } });
      await tx.product.update({ where: { id }, data });
      await tx.productCategory.deleteMany({ where: { productId: id } });
    } else {
      id = (await tx.product.create({ data })).id;
    }
    if (categoryIds.length) {
      await tx.productCategory.createMany({
        data: categoryIds.map((categoryId) => ({ productId: id!, categoryId })),
      });
    }
    // Urutan gambar: gambar lama sesuai urutan di form, lalu gambar baru
    for (const [i, imageId] of keptImageIds.entries()) {
      await tx.productImage.updateMany({ where: { id: imageId, productId: id! }, data: { sortOrder: i } });
    }
    if (newUrls.length) {
      await tx.productImage.createMany({
        data: newUrls.map((url, i) => ({
          productId: id!,
          url,
          alt: rest.name,
          sortOrder: keptImageIds.length + i,
        })),
      });
    }
  });
  await deleteUnusedImages(removedUrls);

  revalidatePath("/admin/produk");
  redirect(`/admin/produk/${id}?ok=${encodeURIComponent("Produk tersimpan")}`);
}

export async function deleteProduct(productId: string) {
  await requireStaff();
  const images = await db.productImage.findMany({ where: { productId } });
  await db.product.delete({ where: { id: productId } });
  await deleteUnusedImages(images.map((i) => i.url));
  revalidatePath("/admin/produk");
  redirect(`/admin/produk?ok=${encodeURIComponent("Produk dihapus")}`);
}

export async function duplicateProduct(productId: string) {
  await requireStaff();
  const source = await db.product.findUniqueOrThrow({
    where: { id: productId },
    include: { categories: true, images: true },
  });
  const { categories, images } = source;
  const fields = Object.fromEntries(
    Object.entries(source).filter(([k]) => !["id", "createdAt", "updatedAt", "soldCount", "categories", "images"].includes(k)),
  ) as Omit<typeof source, "id" | "createdAt" | "updatedAt" | "soldCount" | "categories" | "images">;
  const copy = await db.product.create({
    data: {
      ...fields,
      name: `${source.name} (Salinan)`,
      slug: await uniqueSlug(`${source.name}-salinan`),
      sku: null,
      status: "DRAFT",
      categories: { create: categories.map((c) => ({ categoryId: c.categoryId })) },
      // Gambar dipakai bersama (URL sama); file hanya dihapus bila tidak dipakai produk lain
      images: { create: images.map((i) => ({ url: i.url, alt: i.alt, sortOrder: i.sortOrder })) },
    },
  });
  redirect(`/admin/produk/${copy.id}?ok=${encodeURIComponent("Produk diduplikat sebagai draft")}`);
}

export async function quickUpdateProduct(productId: string, formData: FormData) {
  await requireStaff();
  const price = Number(formData.get("price"));
  const stock = Number(formData.get("stock"));
  if (!Number.isInteger(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return;
  await db.product.update({ where: { id: productId }, data: { price, stock } });
  revalidatePath("/admin/produk");
}

export async function bulkProductAction(formData: FormData) {
  await requireStaff();
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const action = String(formData.get("bulkAction") ?? "");
  const back = String(formData.get("back") ?? "/admin/produk");
  const backUrl = back.startsWith("/admin/produk") ? back : "/admin/produk";
  const sep = backUrl.includes("?") ? "&" : "?";
  if (ids.length === 0) redirect(`${backUrl}${sep}error=${encodeURIComponent("Pilih minimal satu produk")}`);

  switch (action) {
    case "publish":
    case "draft":
      await db.product.updateMany({
        where: { id: { in: ids } },
        data: { status: action === "publish" ? "PUBLISHED" : "DRAFT" },
      });
      break;
    case "delete": {
      const images = await db.productImage.findMany({ where: { productId: { in: ids } } });
      await db.product.deleteMany({ where: { id: { in: ids } } });
      await deleteUnusedImages(images.map((i) => i.url));
      break;
    }
    case "category": {
      const categoryId = String(formData.get("categoryId") ?? "");
      if (!categoryId) redirect(`${backUrl}${sep}error=${encodeURIComponent("Pilih kategori tujuan")}`);
      await db.$transaction([
        db.productCategory.deleteMany({ where: { productId: { in: ids } } }),
        db.productCategory.createMany({ data: ids.map((productId) => ({ productId, categoryId })) }),
      ]);
      break;
    }
    default:
      redirect(`${backUrl}${sep}error=${encodeURIComponent("Pilih aksi")}`);
  }
  revalidatePath("/admin/produk");
  redirect(`${backUrl}${sep}ok=${encodeURIComponent(`${ids.length} produk diperbarui`)}`);
}
