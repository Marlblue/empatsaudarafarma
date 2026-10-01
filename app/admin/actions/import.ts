"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { importProductsCsv, type ImportResult } from "@/lib/product-csv";
import { isUploadedFile } from "@/lib/storage";

export type ImportState = (ImportResult & { done: true }) | { done: false; message: string } | null;

export async function importProducts(_prev: ImportState, formData: FormData): Promise<ImportState> {
  await requireStaff();
  const file = formData.get("file");
  if (!isUploadedFile(file)) return { done: false, message: "Pilih file CSV terlebih dahulu." };
  if (file.size > 10 * 1024 * 1024) return { done: false, message: "Ukuran file maksimal 10 MB." };
  const mode = formData.get("mode") === "create" ? "create" : "upsert";
  const result = await importProductsCsv(await file.text(), mode);
  revalidatePath("/admin/produk");
  return { ...result, done: true };
}
