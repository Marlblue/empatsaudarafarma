"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { deleteUpload, isUploadedFile, saveUpload } from "@/lib/storage";

const schema = z.object({
  name: z.string().trim().min(2, "Nama kategori minimal 2 karakter").max(100),
  slug: z.string().trim().max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  parentId: z.string().optional(),
  sortOrder: z.coerce.number().int().default(0),
});

function back(message: string, isError = false): never {
  redirect(`/admin/kategori?${isError ? "error" : "ok"}=${encodeURIComponent(message)}`);
}

export async function saveCategory(categoryId: string | null, formData: FormData) {
  await requireStaff();
  const parsed = schema.safeParse(Object.fromEntries([...formData].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) back(parsed.error.issues[0].message, true);
  const { name, description, sortOrder } = parsed.data;
  const slug = slugify(parsed.data.slug || name);
  const parentId = parsed.data.parentId || null;

  if (categoryId && parentId === categoryId) back("Kategori tidak bisa menjadi induk dirinya sendiri", true);
  if (parentId) {
    const parent = await db.category.findUnique({ where: { id: parentId } });
    // Batasi 2 tingkat (induk → anak) agar menu tetap rapi
    if (!parent || parent.parentId) back("Kategori induk harus kategori tingkat atas", true);
  }
  if (categoryId && parentId && (await db.category.count({ where: { parentId: categoryId } })) > 0) {
    back("Kategori yang punya sub-kategori tidak bisa dijadikan sub-kategori", true);
  }
  const dup = await db.category.findUnique({ where: { slug } });
  if (dup && dup.id !== categoryId) back(`Slug "${slug}" sudah dipakai`, true);

  let image: string | undefined;
  const file = formData.get("image");
  if (isUploadedFile(file)) {
    try {
      image = await saveUpload(file, "categories");
    } catch (e) {
      back((e as Error).message, true);
    }
  }

  const data = { name, slug, description: description || null, parentId, sortOrder, ...(image && { image }) };
  if (categoryId) {
    const old = await db.category.findUnique({ where: { id: categoryId } });
    await db.category.update({ where: { id: categoryId }, data });
    if (image && old?.image) await deleteUpload(old.image);
  } else {
    await db.category.create({ data });
  }
  revalidatePath("/", "layout");
  back("Kategori tersimpan");
}

export async function deleteCategory(categoryId: string) {
  await requireStaff();
  const [products, children] = await Promise.all([
    db.productCategory.count({ where: { categoryId } }),
    db.category.count({ where: { parentId: categoryId } }),
  ]);
  if (products > 0) back(`Kategori masih berisi ${products} produk. Pindahkan produknya terlebih dahulu.`, true);
  if (children > 0) back("Hapus atau pindahkan sub-kategori terlebih dahulu.", true);
  const cat = await db.category.delete({ where: { id: categoryId } });
  if (cat.image) await deleteUpload(cat.image);
  revalidatePath("/", "layout");
  back("Kategori dihapus");
}
