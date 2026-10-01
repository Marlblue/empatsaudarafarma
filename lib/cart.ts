import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const CART_COOKIE = "cart_id";

const cartInclude = {
  items: {
    orderBy: { id: "asc" },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          stock: true,
          trackStock: true,
          status: true,
          weightGram: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        },
      },
    },
  },
} as const;

/** Baca keranjang aktif (tanpa membuat baru). Aman dipanggil dari Server Component. */
export const getCart = cache(async () => {
  const user = await getCurrentUser();
  if (user) {
    return db.cart.findUnique({ where: { userId: user.id }, include: cartInclude });
  }
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return null;
  return db.cart.findFirst({ where: { id: cartId, userId: null }, include: cartInclude });
});

export type CartWithItems = NonNullable<Awaited<ReturnType<typeof getCart>>>;

export function cartSummary(cart: CartWithItems | null) {
  const items = (cart?.items ?? []).filter((i) => i.product.status === "PUBLISHED");
  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((n, i) => n + i.quantity * i.product.price, 0);
  const weight = items.reduce((n, i) => n + i.quantity * i.product.weightGram, 0);
  return { items, count, subtotal, weight };
}

/** Ambil atau buat keranjang. Hanya untuk Server Action (bisa men-set cookie). */
export async function getOrCreateCartId() {
  const user = await getCurrentUser();
  if (user) {
    const cart = await db.cart.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
    return cart.id;
  }
  const jar = await cookies();
  const existing = jar.get(CART_COOKIE)?.value;
  if (existing) {
    const cart = await db.cart.findFirst({ where: { id: existing, userId: null } });
    if (cart) return cart.id;
  }
  const cart = await db.cart.create({ data: {} });
  jar.set(CART_COOKIE, cart.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return cart.id;
}

/** Gabungkan keranjang tamu ke keranjang akun setelah login/daftar. */
export async function mergeGuestCart(userId: string) {
  const jar = await cookies();
  const guestId = jar.get(CART_COOKIE)?.value;
  if (!guestId) return;
  const guest = await db.cart.findFirst({
    where: { id: guestId, userId: null },
    include: { items: true },
  });
  jar.delete(CART_COOKIE);
  if (!guest) return;

  const userCart = await db.cart.upsert({ where: { userId }, create: { userId }, update: {} });
  for (const item of guest.items) {
    await db.cartItem.upsert({
      where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
      create: { cartId: userCart.id, productId: item.productId, quantity: item.quantity },
      update: { quantity: { increment: item.quantity } },
    });
  }
  await db.cart.delete({ where: { id: guest.id } });
}
