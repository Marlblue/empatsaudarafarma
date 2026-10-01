import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { isInStock } from "@/lib/catalog";
import { discountPercent } from "@/lib/format";
import { Price } from "@/components/price";
import { ProductImage } from "@/components/product-image";
import { QuickView } from "@/components/quick-view";

export function ProductCard({ product, center = false }: { product: ProductCardData; center?: boolean }) {
  const image = product.images[0]?.url ?? null;
  const category = product.categories[0]?.category;
  const off = discountPercent(product.price, product.compareAtPrice);
  const inStock = isInStock(product);

  return (
    <div className={`group flex flex-col ${center ? "text-center" : ""}`}>
      <div className="relative aspect-[247/296] overflow-hidden bg-white">
        <Link href={`/produk/${product.slug}`} aria-label={product.name} className="absolute inset-0">
          <ProductImage
            src={image}
            alt={product.images[0]?.alt ?? product.name}
            fit="cover"
            sizes="(min-width: 1140px) 260px, (min-width: 768px) 30vw, 50vw"
            className="transition duration-300 group-hover:scale-[1.03]"
          />
        </Link>
        {off > 0 && (
          <span className="pointer-events-none absolute left-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-sky text-[13px] font-bold text-white">
            -{off}%
          </span>
        )}
        {!inStock && (
          <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 bg-white/90 py-2 text-center text-[13px] font-bold uppercase text-[#555]">
            Stok Habis
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 translate-y-full transition duration-200 group-hover:translate-y-0 max-md:hidden">
          <QuickView
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              compareAtPrice: product.compareAtPrice,
              shortDescription: product.shortDescription,
              image,
              category: category?.name ?? null,
              maxQuantity: product.trackStock ? product.stock : null,
              requiresPrescription: product.requiresPrescription,
            }}
          />
        </div>
      </div>
      <div className="pb-5 pt-2.5">
        {category && (
          <p className="mb-0.5 text-[10.8px] uppercase tracking-[0.05em] text-body opacity-70">{category.name}</p>
        )}
        <Link href={`/produk/${product.slug}`} className="line-clamp-3 text-[14.4px] leading-[1.45] text-[#333] hover:text-cta">
          {product.name}
        </Link>
        <div className="mt-1">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
        </div>
      </div>
    </div>
  );
}

export function ProductGrid({
  products,
  columns = 3,
  center = false,
}: {
  products: ProductCardData[];
  columns?: 3 | 4;
  center?: boolean;
}) {
  return (
    <div className={`grid grid-cols-2 gap-x-[15px] md:gap-x-[30px] ${columns === 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} center={center} />
      ))}
    </div>
  );
}
