"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, requireStaff } from "@/lib/auth";
import { saveSettings, type StoreSettings } from "@/lib/settings";
import { JABODETABEK, PROVINCES } from "@/lib/shipping";
import { deleteUpload, isUploadedFile, saveUpload } from "@/lib/storage";

function go(path: string, message: string, isError = false): never {
  revalidatePath(path);
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${isError ? "error" : "ok"}=${encodeURIComponent(message)}`);
}

// ---------- Ulasan ----------
export async function moderateReview(reviewId: string, status: "APPROVED" | "REJECTED") {
  await requireStaff();
  await db.review.update({ where: { id: reviewId }, data: { status } });
  go("/admin/ulasan", status === "APPROVED" ? "Ulasan ditampilkan" : "Ulasan ditolak");
}

export async function deleteReview(reviewId: string) {
  await requireStaff();
  await db.review.delete({ where: { id: reviewId } });
  go("/admin/ulasan", "Ulasan dihapus");
}

// ---------- Pesan kontak ----------
export async function toggleMessageRead(messageId: string, isRead: boolean) {
  await requireStaff();
  await db.contactMessage.update({ where: { id: messageId }, data: { isRead } });
  revalidatePath("/admin/pesan");
}

export async function deleteMessage(messageId: string) {
  await requireStaff();
  await db.contactMessage.delete({ where: { id: messageId } });
  go("/admin/pesan", "Pesan dihapus");
}

// ---------- Newsletter ----------
export async function deleteSubscriber(id: string) {
  await requireStaff();
  await db.newsletterSubscriber.delete({ where: { id } });
  go("/admin/newsletter", "Email dihapus dari daftar");
}

// ---------- Pelanggan ----------
export async function setCustomerActive(userId: string, isActive: boolean) {
  await requireStaff();
  await db.user.update({ where: { id: userId, role: "CUSTOMER" }, data: { isActive } });
  if (!isActive) await db.session.deleteMany({ where: { userId } });
  go(`/admin/pelanggan/${userId}`, isActive ? "Akun diaktifkan" : "Akun dinonaktifkan");
}

/** Buat password sementara untuk pelanggan yang lupa password; ditampilkan sekali ke admin. */
export async function resetCustomerPassword(userId: string) {
  await requireStaff();
  const temp = randomBytes(5).toString("hex");
  await db.user.update({ where: { id: userId, role: "CUSTOMER" }, data: { passwordHash: await hashPassword(temp) } });
  await db.session.deleteMany({ where: { userId } });
  return { password: temp };
}

// ---------- Banner (khusus ADMIN) ----------
const bannerSchema = z.object({
  title: z.string().trim().max(150).optional(),
  link: z
    .string()
    .trim()
    .max(300)
    .optional()
    .refine((v) => !v || v.startsWith("/") || /^https?:\/\//.test(v), "Link harus diawali / atau http(s)://"),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.string().optional(),
});

export async function saveBanner(bannerId: string | null, formData: FormData) {
  await requireStaff({ adminOnly: true });
  const parsed = bannerSchema.safeParse(Object.fromEntries([...formData].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) go("/admin/banner", parsed.error.issues[0].message, true);

  const desktop = formData.get("imageDesktop");
  const mobile = formData.get("imageMobile");
  const existing = bannerId ? await db.banner.findUnique({ where: { id: bannerId } }) : null;
  if (!existing && !isUploadedFile(desktop)) go("/admin/banner", "Gambar desktop wajib diunggah", true);

  let imageDesktop = existing?.imageDesktop;
  let imageMobile = existing?.imageMobile ?? null;
  try {
    if (isUploadedFile(desktop)) imageDesktop = await saveUpload(desktop, "banners");
    if (isUploadedFile(mobile)) imageMobile = await saveUpload(mobile, "banners");
  } catch (e) {
    go("/admin/banner", (e as Error).message, true);
  }

  const data = {
    title: parsed.data.title || null,
    link: parsed.data.link || null,
    sortOrder: parsed.data.sortOrder,
    isActive: parsed.data.isActive === "on",
    imageDesktop: imageDesktop!,
    imageMobile,
  };
  if (existing) {
    await db.banner.update({ where: { id: existing.id }, data });
    if (existing.imageDesktop !== data.imageDesktop) await deleteUpload(existing.imageDesktop);
    if (existing.imageMobile && existing.imageMobile !== data.imageMobile) await deleteUpload(existing.imageMobile);
  } else {
    await db.banner.create({ data });
  }
  revalidatePath("/");
  go("/admin/banner", "Banner tersimpan");
}

export async function deleteBanner(bannerId: string) {
  await requireStaff({ adminOnly: true });
  const banner = await db.banner.delete({ where: { id: bannerId } });
  await deleteUpload(banner.imageDesktop);
  if (banner.imageMobile) await deleteUpload(banner.imageMobile);
  revalidatePath("/");
  go("/admin/banner", "Banner dihapus");
}

// ---------- Pengaturan toko (khusus ADMIN) ----------
function lines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** "Judul | Teks" per baris */
function highlights(value: FormDataEntryValue | null) {
  return lines(value).map((l) => {
    const [title, ...rest] = l.split("|");
    return { title: title.trim(), text: rest.join("|").trim() };
  });
}

const settingsSchema = z.object({
  storeName: z.string().trim().min(2, "Nama toko wajib diisi").max(100),
  tagline: z.string().trim().max(150),
  whatsapp: z.string().trim().min(8, "Nomor WhatsApp wajib diisi").max(20),
  csName: z.string().trim().max(50),
  email: z.union([z.literal(""), z.string().trim().email("Email tidak valid")]),
  address: z.string().trim().max(500),
  hours: z.string().trim().max(150),
  mapEmbedUrl: z.string().trim().max(2000),
  tokopediaUrl: z.string().trim().max(300),
  shopeeUrl: z.string().trim().max(300),
  instagramUrl: z.string().trim().max(300),
  facebookUrl: z.string().trim().max(300),
  twitterUrl: z.string().trim().max(300),
  licenseInfo: z.string().trim().max(300),
  aboutContent: z.string().trim().max(20000),
  flatShippingCost: z.coerce.number().int().min(0),
  freeShippingMin: z.coerce.number().int().min(0),
  paymentDueHours: z.coerce.number().int().min(1).max(720),
});

export async function updateSettings(formData: FormData) {
  await requireStaff({ adminOnly: true });
  const parsed = settingsSchema.safeParse(Object.fromEntries([...formData].filter(([, v]) => typeof v === "string")));
  if (!parsed.success) go("/admin/pengaturan", parsed.error.issues[0].message, true);

  const banks = lines(formData.get("banks")).map((l) => {
    const [bank = "", number = "", holder = ""] = l.split("|").map((s) => s.trim());
    return { bank, number, holder };
  });
  if (banks.some((b) => !b.bank || !b.number || !b.holder)) {
    go("/admin/pengaturan", "Format rekening: Bank | Nomor | Atas nama (satu per baris)", true);
  }

  const patch: Partial<StoreSettings> = {
    ...parsed.data,
    banks,
    features: highlights(formData.get("features")),
    services: highlights(formData.get("services")),
    codEnabled: formData.get("codEnabled") === "on",
  };

  const logo = formData.get("logo");
  if (isUploadedFile(logo)) {
    try {
      patch.logoUrl = await saveUpload(logo, "branding");
    } catch (e) {
      go("/admin/pengaturan", (e as Error).message, true);
    }
  } else if (formData.get("removeLogo") === "on") {
    patch.logoUrl = "";
  }

  await saveSettings(patch);
  revalidatePath("/", "layout");
  go("/admin/pengaturan", "Pengaturan tersimpan");
}

export async function saveShippingRate(formData: FormData) {
  await requireStaff({ adminOnly: true });
  const region = String(formData.get("region") ?? "").trim();
  const cost = Number(formData.get("cost"));
  if (!(region === JABODETABEK || PROVINCES.includes(region)) || !Number.isInteger(cost) || cost < 0) {
    go("/admin/pengaturan", "Pilih wilayah dan isi tarif yang valid", true);
  }
  await db.shippingRate.upsert({ where: { region }, create: { region, cost }, update: { cost } });
  go("/admin/pengaturan", `Tarif ${region} tersimpan`);
}

export async function deleteShippingRate(id: string) {
  await requireStaff({ adminOnly: true });
  await db.shippingRate.delete({ where: { id } });
  go("/admin/pengaturan", "Tarif dihapus");
}

// ---------- Pengguna admin (khusus ADMIN) ----------
const staffSchema = z.object({
  name: z.string().trim().min(2, "Nama wajib diisi").max(100),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  role: z.enum(["ADMIN", "STAFF"]),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export async function createStaff(formData: FormData) {
  await requireStaff({ adminOnly: true });
  const parsed = staffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) go("/admin/pengguna", parsed.error.issues[0].message, true);
  const { password, ...data } = parsed.data;
  if (await db.user.findUnique({ where: { email: data.email } })) go("/admin/pengguna", "Email sudah terdaftar", true);
  await db.user.create({ data: { ...data, passwordHash: await hashPassword(password) } });
  go("/admin/pengguna", "Pengguna ditambahkan");
}

export async function updateStaff(userId: string, formData: FormData) {
  const me = await requireStaff({ adminOnly: true });
  const role = formData.get("role") === "ADMIN" ? "ADMIN" : "STAFF";
  const isActive = formData.get("isActive") === "on";
  const password = String(formData.get("password") ?? "");
  if (userId === me.id && (role !== "ADMIN" || !isActive)) {
    go("/admin/pengguna", "Anda tidak bisa menurunkan peran atau menonaktifkan akun sendiri", true);
  }
  if (password && password.length < 8) go("/admin/pengguna", "Password minimal 8 karakter", true);
  await db.user.update({
    where: { id: userId, role: { in: ["ADMIN", "STAFF"] } },
    data: { role, isActive, ...(password && { passwordHash: await hashPassword(password) }) },
  });
  if (!isActive || password) await db.session.deleteMany({ where: { userId, NOT: { userId: me.id } } });
  go("/admin/pengguna", "Pengguna diperbarui");
}
