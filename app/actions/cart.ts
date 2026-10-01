"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getOrCreateCartId, getCart } from "@/lib/cart";

export type CartActionState = { ok: boolean; message: string } | null;

async function availableQuantity(productId: string) {
  const product = await db.product.findFirst({
    where: { id: productId, status: "PUBLISHED" },
    select: { stock: true, trackStock: true },
  });
  if (!product) return null;
  return product.trackStock ? product.stock : Number.MAX_SAFE_INTEGER;
}

export async function addToCart(_prev: CartActionState, formData: FormData): Promise<CartActionState> {
  const productId = String(formData.get("productId") ?? "");
  const quantity = Math.max(1, Math.floor(Number(formData.get("quantity") ?? 1)) || 1);

  const available = await availableQuantity(productId);
  if (available === null) return { ok: false, message: "Produk tidak ditemukan." };
  if (available <= 0) return { ok: false, message: "Maaf, stok produk sedang habis." };

  const cartId = await getOrCreateCartId();
  const existing = await db.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
  });
  const nextQty = Math.min((existing?.quantity ?? 0) + quantity, available);
  await db.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    create: { cartId, productId, quantity: nextQty },
    update: { quantity: nextQty },
  });
  revalidatePath("/", "layout");
  const capped = nextQty < (existing?.quantity ?? 0) + quantity;
  return {
    ok: true,
    message: capped
      ? `Jumlah disesuaikan dengan stok tersedia (${nextQty}).`
      : "Produk ditambahkan ke keranjang.",
  };
}

async function ownedItem(itemId: string) {
  const cart = await getCart();
  if (!cart) return null;
  return cart.items.find((i) => i.id === itemId) ?? null;
}

export async function updateCartItem(itemId: string, formData: FormData) {
  const item = await ownedItem(itemId);
  if (!item) return;
  const quantity = Math.floor(Number(formData.get("quantity") ?? 1));
  if (!quantity || quantity < 1) {
    await db.cartItem.delete({ where: { id: item.id } });
  } else {
    const max = item.product.trackStock ? item.product.stock : quantity;
    await db.cartItem.update({
      where: { id: item.id },
      data: { quantity: Math.min(quantity, Math.max(max, 1)) },
    });
  }
  revalidatePath("/", "layout");
}

export async function removeCartItem(itemId: string) {
  const item = await ownedItem(itemId);
  if (!item) return;
  await db.cartItem.delete({ where: { id: item.id } });
  revalidatePath("/", "layout");
}
