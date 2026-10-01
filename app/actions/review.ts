"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type ReviewState = { ok: boolean; message: string } | null;

const schema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Pilih rating").max(5),
  comment: z.string().trim().min(5, "Ulasan minimal 5 karakter").max(1000),
});

export async function submitReview(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Silakan masuk untuk menulis ulasan." };
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const { productId, rating, comment } = parsed.data;
  const product = await db.product.findFirst({ where: { id: productId, status: "PUBLISHED" } });
  if (!product) return { ok: false, message: "Produk tidak ditemukan." };

  await db.review.upsert({
    where: { productId_userId: { productId, userId: user.id } },
    create: { productId, userId: user.id, rating, comment },
    update: { rating, comment, status: "PENDING" },
  });
  return { ok: true, message: "Terima kasih! Ulasan Anda akan tampil setelah disetujui admin." };
}
