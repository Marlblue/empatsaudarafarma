/**
 * Ubah gambar menjadi WebP di browser sebelum diunggah: lebih kecil ~60% dari JPG/PNG dan server
 * tidak perlu library gambar. Sisi terpanjang diperkecil ke `maxSize`. Bila konversi gagal atau
 * hasilnya tidak lebih kecil, file asli yang dipakai.
 */
export async function toWebp(file: File, { maxSize = 1600, quality = 0.82 } = {}): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
    if (!blob || blob.type !== "image/webp") return file;
    if (file.type === "image/webp" && scale === 1 && blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file;
  }
}
