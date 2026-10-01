import type { Metadata } from "next";
import Link from "next/link";
import { removeCartItem, updateCartItem } from "@/app/actions/cart";
import { cartSummary, getCart } from "@/lib/cart";
import { formatRupiah, waLink } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { ProductImage } from "@/components/product-image";

export const metadata: Metadata = { title: "Keranjang", robots: { index: false } };

export default async function CartPage() {
  const [cart, settings] = await Promise.all([getCart(), getSettings()]);
  const { items, subtotal } = cartSummary(cart);

  if (items.length === 0) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-bold text-brand-900">Keranjang Anda kosong</h1>
        <p className="mt-2 text-gray-600">Yuk, cari produk kesehatan yang Anda butuhkan.</p>
        <Link href="/shop" className="btn-primary mt-6">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  const waText =
    `Halo ${settings.storeName}, saya ingin memesan:\n\n` +
    items.map((i, n) => `${n + 1}. ${i.product.name} x${i.quantity} = ${formatRupiah(i.product.price * i.quantity)}`).join("\n") +
    `\n\nTotal: ${formatRupiah(subtotal)}`;

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-900">Keranjang Belanja</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200">
          {items.map((item) => {
            const max = item.product.trackStock ? item.product.stock : 999;
            const overStock = item.product.trackStock && item.quantity > item.product.stock;
            return (
              <li key={item.id} className="flex gap-4 p-4">
                <Link href={`/produk/${item.product.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                  <ProductImage src={item.product.images[0]?.url} alt={item.product.name} sizes="80px" />
                </Link>
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <Link href={`/produk/${item.product.slug}`} className="font-semibold text-gray-900 hover:text-brand-700">
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-gray-500">{formatRupiah(item.product.price)}</p>
                    {overStock && (
                      <p className="text-xs font-semibold text-red-600">Stok tersisa {item.product.stock}</p>
                    )}
                  </div>
                  <form action={updateCartItem.bind(null, item.id)} className="flex items-center gap-2">
                    <input
                      type="number"
                      name="quantity"
                      min={1}
                      max={max}
                      defaultValue={item.quantity}
                      aria-label={`Jumlah ${item.product.name}`}
                      className="input w-20"
                    />
                    <button className="text-sm font-semibold text-brand-700 hover:underline">Ubah</button>
                  </form>
                  <p className="w-28 font-bold text-gray-900 sm:text-right">
                    {formatRupiah(item.product.price * item.quantity)}
                  </p>
                  <form action={removeCartItem.bind(null, item.id)}>
                    <button className="text-sm text-red-600 hover:underline" aria-label={`Hapus ${item.product.name}`}>
                      Hapus
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="card h-fit space-y-4 p-5">
          <h2 className="font-bold text-brand-900">Ringkasan</h2>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal ({items.reduce((n, i) => n + i.quantity, 0)} item)</span>
            <span className="font-semibold">{formatRupiah(subtotal)}</span>
          </div>
          <p className="text-xs text-gray-500">Ongkos kirim dihitung saat checkout.</p>
          <Link href="/checkout" className="btn-primary w-full">
            Checkout
          </Link>
          <a href={waLink(settings.whatsapp, waText)} target="_blank" rel="noopener" className="btn-wa w-full">
            Pesan Semua via WhatsApp
          </a>
          <Link href="/shop" className="block text-center text-sm text-brand-700 hover:underline">
            ← Lanjut belanja
          </Link>
        </aside>
      </div>
    </div>
  );
}
