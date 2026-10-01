"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addToCart, type CartActionState } from "@/app/actions/cart";

const number = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export function AddToCartForm({
  productId,
  maxQuantity,
  price,
  weightGram,
}: {
  productId: string;
  /** null = stok tidak dilacak */
  maxQuantity: number | null;
  /** Bila diisi, tampilkan "Total Produk" seperti di amanfarma.com */
  price?: number;
  weightGram?: number;
}) {
  const [state, action, pending] = useActionState<CartActionState, FormData>(addToCart, null);
  const [qty, setQty] = useState(1);
  const soldOut = maxQuantity !== null && maxQuantity <= 0;
  const max = maxQuantity ?? 9999;
  const step = "w-[37px] border border-[#ddd] bg-[#f9f9f9] text-[#666] hover:bg-[#eee]";

  if (soldOut) {
    return <p className="border border-line bg-[#f9f9f9] px-4 py-3 text-sm font-bold uppercase text-[#999]">Stok habis</p>;
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      <div className="flex h-[55px] w-fit">
        <button type="button" aria-label="Kurangi jumlah" className={step} onClick={() => setQty((q) => Math.max(1, q - 1))}>
          -
        </button>
        <input
          name="quantity"
          type="number"
          min={1}
          max={max}
          value={qty}
          onChange={(e) => setQty(Math.min(max, Math.max(1, Number(e.target.value) || 1)))}
          className="w-[42px] border-y border-[#ddd] text-center text-[15px] text-[#666] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
          aria-label="Jumlah"
        />
        <button type="button" aria-label="Tambah jumlah" className={step} onClick={() => setQty((q) => Math.min(max, q + 1))}>
          +
        </button>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-[56px] bg-ink px-4 text-base font-medium uppercase tracking-[0.03em] text-white hover:bg-black disabled:opacity-60"
      >
        {pending ? "Menambahkan..." : "Tambah ke Keranjang"}
      </button>
      {state && (
        <p aria-live="polite" className={`text-sm ${state.ok ? "text-green-700" : "text-red-600"}`}>
          {state.message}{" "}
          {state.ok && (
            <Link href="/keranjang" className="font-bold text-ink underline">
              Lihat keranjang
            </Link>
          )}
        </p>
      )}
      {price !== undefined && (
        <div className="space-y-3 pt-2 text-[15px]">
          <p>
            Total Produk: <span className="text-2xl text-[#555]">{number.format(price * qty)}</span>
          </p>
          {!!weightGram && <p>Total Berat: {number.format(weightGram * qty)}</p>}
        </div>
      )}
    </form>
  );
}
