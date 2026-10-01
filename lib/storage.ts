import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

export const UPLOAD_ROOT = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? "./uploads");

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const PROOF_TYPES: Record<string, string> = { ...IMAGE_TYPES, "application/pdf": "pdf" };

export const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
};

export function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && value.size > 0;
}

/**
 * Simpan file upload ke disk dan kembalikan URL publiknya (`/uploads/...`).
 * Untuk hosting serverless, ganti implementasi ini dengan Vercel Blob / S3.
 */
export async function saveUpload(file: File, folder: string, kind: "image" | "proof" = "image") {
  const allowed = kind === "proof" ? PROOF_TYPES : IMAGE_TYPES;
  const ext = allowed[file.type];
  if (!ext) throw new Error(`Tipe file tidak didukung: ${file.type || "tidak diketahui"}`);
  if (file.size > 5 * 1024 * 1024) throw new Error("Ukuran file maksimal 5 MB");

  const dir = path.join(/*turbopackIgnore: true*/ UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await writeFile(path.join(/*turbopackIgnore: true*/ dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${folder}/${name}`;
}

/** Simpan gambar dari URL (dipakai import CSV) */
export async function saveUploadFromUrl(url: string, folder: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal mengunduh gambar: ${url}`);
  const type = res.headers.get("content-type")?.split(";")[0] ?? "";
  const blob = await res.blob();
  return saveUpload(new File([blob], "image", { type }), folder);
}

export async function deleteUpload(url: string) {
  if (!url.startsWith("/uploads/")) return;
  const target = path.resolve(/*turbopackIgnore: true*/ UPLOAD_ROOT, url.slice("/uploads/".length));
  if (!target.startsWith(UPLOAD_ROOT + path.sep)) return;
  await unlink(target).catch(() => {});
}
