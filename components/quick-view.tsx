"use client";

import Link from "next/link";
import { useRef } from "react";
import { AddToCartForm } from "@/components/add-to-cart";
import { Price } from "@/components/price";
import { ProductImage } from "@/components/product-image";

export type QuickViewProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  shortDescription: string | null;
  image: string | null;
  category: string | null;
  maxQuantity: number | null;
  requiresPrescription: boolean;
};

export function QuickView({ product }: { product: QuickViewProduct }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="w-full bg-ink/85 py-2 text-[12px] font-bold uppercase tracking-[0.05em] text-white hover:bg-ink"
      >
        Quick View
      </button>
      <dialog
        ref={ref}
        className="m-auto w-[min(92vw,820px)] p-0 text-body backdrop:bg-black/60"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
      >
        <div className="grid gap-6 p-5 md:grid-cols-2 md:p-6">
          <div className="relative aspect-square overflow-hidden bg-white">
            <ProductImage src={product.image} alt={product.name} sizes="380px" />
          </div>
          <div className="flex flex-col gap-3 text-left">
            <div className="flex items-start justify-between gap-2">
              <div>
                {product.category && (
                  <p className="text-[11px] uppercase tracking-wide opacity-70">{product.category}</p>
                )}
                <h2 className="text-2xl font-bold text-heading">{product.name}</h2>
              </div>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => ref.current?.close()}
                className="rounded-full p-1 text-2xl leading-none text-gray-400 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
            {product.requiresPrescription && (
              <p className="rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700">
                Obat keras — wajib resep dokter
              </p>
            )}
            {product.shortDescription && <p className="text-sm text-gray-600">{product.shortDescription}</p>}
            <AddToCartForm productId={product.id} maxQuantity={product.maxQuantity} />
            <Link href={`/produk/${product.slug}`} className="text-sm font-bold uppercase text-ink hover:underline">
              Lihat detail produk →
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
