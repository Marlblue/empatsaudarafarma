import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";

export const SESSION_COOKIE = "sid";
const SESSION_DAYS = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({ data: { id: hashToken(token), userId, expiresAt } });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
      },
    },
  });
  if (!session || session.expiresAt < new Date() || !session.user.isActive) return null;
  return session.user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export function isStaff(role: Role) {
  return role === "ADMIN" || role === "STAFF";
}

/** Untuk halaman & action pelanggan */
export async function requireUser(next = "/akun") {
  const user = await getCurrentUser();
  if (!user) redirect(`/masuk?next=${encodeURIComponent(next)}`);
  return user;
}

/** Untuk semua halaman & action di /admin. `adminOnly` membatasi ke peran ADMIN. */
export async function requireStaff({ adminOnly = false } = {}) {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) redirect("/admin/login");
  if (adminOnly && user.role !== "ADMIN") redirect("/admin?error=forbidden");
  return user;
}
