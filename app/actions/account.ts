"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { PROVINCES } from "@/lib/shipping";

export type AccountState = { ok: boolean; message: string; fieldErrors?: Record<string, string[]> } | null;

const addressSchema = z.object({
  label: z.string().trim().min(1).max(30).default("Rumah"),
  recipient: z.string().trim().min(2, "Nama penerima wajib diisi").max(100),
  phone: z.string().trim().regex(/^[0-9+\-\s]{8,20}$/, "Nomor HP tidak valid"),
  province: z.enum(PROVINCES as [string, ...string[]], { message: "Pilih provinsi" }),
  city: z.string().trim().min(2, "Kota wajib diisi").max(100),
  district: z.string().trim().min(2, "Kecamatan wajib diisi").max(100),
  postalCode: z.string().trim().regex(/^\d{5}$/, "Kode pos 5 digit"),
  detail: z.string().trim().min(5, "Alamat lengkap wajib diisi").max(500),
  isDefault: z.string().optional(),
});

export async function saveAddress(addressId: string | null, _prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser("/akun/alamat");
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Periksa kembali data alamat.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const { isDefault, ...data } = parsed.data;
  const makeDefault = isDefault === "on" || (await db.address.count({ where: { userId: user.id } })) === 0;

  await db.$transaction(async (tx) => {
    if (makeDefault) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    if (addressId) {
      const updated = await tx.address.updateMany({
        where: { id: addressId, userId: user.id },
        data: { ...data, ...(makeDefault && { isDefault: true }) },
      });
      if (updated.count === 0) throw new Error("Alamat tidak ditemukan");
    } else {
      await tx.address.create({ data: { ...data, userId: user.id, isDefault: makeDefault } });
    }
  });
  revalidatePath("/akun/alamat");
  return { ok: true, message: "Alamat tersimpan." };
}

export async function deleteAddress(addressId: string) {
  const user = await requireUser("/akun/alamat");
  await db.address.deleteMany({ where: { id: addressId, userId: user.id } });
  revalidatePath("/akun/alamat");
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  phone: z.string().trim().regex(/^[0-9+\-\s]{8,20}$/, "Nomor HP tidak valid"),
});

export async function updateProfile(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser("/akun/profil");
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Periksa kembali data Anda.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  await db.user.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath("/akun", "layout");
  return { ok: true, message: "Profil diperbarui." };
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Password lama wajib diisi"),
    password: z.string().min(8, "Password baru minimal 8 karakter"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Konfirmasi password tidak sama", path: ["confirm"] });

export async function changePassword(_prev: AccountState, formData: FormData): Promise<AccountState> {
  const user = await requireUser("/akun/profil");
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, message: "Periksa kembali isian password.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }
  const record = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(parsed.data.current, record.passwordHash))) {
    return { ok: false, message: "Password lama salah.", fieldErrors: { current: ["Password lama salah"] } };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } });
  return { ok: true, message: "Password berhasil diganti." };
}
