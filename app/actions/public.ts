"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export type SimpleState = { ok: boolean; message: string } | null;

async function clientKey(prefix: string) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "local";
  return `${prefix}:${ip}`;
}

export async function subscribeNewsletter(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const parsed = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, message: "Masukkan email yang valid." };
  if (!(await rateLimit(await clientKey("newsletter"), 5, 3600))) {
    return { ok: false, message: "Terlalu banyak percobaan, coba lagi nanti." };
  }
  await db.newsletterSubscriber.upsert({
    where: { email: parsed.data },
    create: { email: parsed.data },
    update: {},
  });
  return { ok: true, message: "Terima kasih! Anda sudah berlangganan newsletter." };
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nama wajib diisi").max(100),
  email: z.string().trim().email("Email tidak valid"),
  phone: z.string().trim().max(20).optional(),
  message: z.string().trim().max(2000).default(""),
});

export async function sendContactMessage(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }
  if (!(await rateLimit(await clientKey("contact"), 5, 3600))) {
    return { ok: false, message: "Terlalu banyak pesan terkirim, coba lagi nanti." };
  }
  await db.contactMessage.create({ data: { ...parsed.data, phone: parsed.data.phone || null } });
  return { ok: true, message: "Pesan terkirim. Kami akan segera menghubungi Anda." };
}
