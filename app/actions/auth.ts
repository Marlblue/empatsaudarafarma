"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createSession,
  destroySession,
  hashPassword,
  isStaff,
  verifyPassword,
} from "@/lib/auth";
import { mergeGuestCart } from "@/lib/cart";
import { rateLimit } from "@/lib/rate-limit";
import { safeNextPath } from "@/lib/format";

export type FormState = { error?: string; fieldErrors?: Record<string, string[]> } | null;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  if (!(await rateLimit(`login:${parsed.data.email}`, 10, 15 * 60))) {
    return { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.isActive || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Email atau password salah." };
  }
  await createSession(user.id);
  await mergeGuestCart(user.id);
  redirect(safeNextPath(formData.get("next")) ?? "/akun");
}

export async function adminLogin(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  if (!(await rateLimit(`admin-login:${parsed.data.email}`, 10, 15 * 60))) {
    return { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit." };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (
    !user ||
    !user.isActive ||
    !isStaff(user.role) ||
    !(await verifyPassword(parsed.data.password, user.passwordHash))
  ) {
    return { error: "Email atau password salah." };
  }
  await createSession(user.id);
  redirect("/admin");
}

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
    email: z.string().trim().toLowerCase().email("Email tidak valid"),
    phone: z.string().trim().regex(/^[0-9+\-\s]{8,20}$/, "Nomor HP tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Konfirmasi password tidak sama",
    path: ["confirm"],
  });

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const { name, email, phone, password } = parsed.data;

  if (await db.user.findUnique({ where: { email } })) {
    return { fieldErrors: { email: ["Email sudah terdaftar. Silakan masuk."] } };
  }
  const user = await db.user.create({
    data: { name, email, phone, passwordHash: await hashPassword(password) },
  });
  await createSession(user.id);
  await mergeGuestCart(user.id);
  redirect(safeNextPath(formData.get("next")) ?? "/akun");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function adminLogout() {
  await destroySession();
  redirect("/admin/login");
}
