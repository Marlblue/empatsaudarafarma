import { discountPercent } from "@/lib/format";

const number = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

/** Nominal gaya WooCommerce/Flatsome: "Rp 215.000" dengan simbol lebih kecil */
export function Amount({ value, className = "", smallSymbol = false }: { value: number; className?: string; smallSymbol?: boolean }) {
  return (
    <span className={`font-bold text-price ${className}`}>
      <span className={smallSymbol ? "mr-[0.25em] align-[0.25em] text-[0.7em]" : "mr-[0.25em]"}>Rp</span>
      {number.format(value)}
    </span>
  );
}

export function Price({
  price,
  compareAtPrice,
  size = "md",
}: {
  price: number;
  compareAtPrice?: number | null;
  size?: "md" | "lg";
}) {
  const off = discountPercent(price, compareAtPrice);
  const text = size === "lg" ? "text-2xl" : "text-[14.4px]";
  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-2 ${text}`}>
      {off > 0 && (
        <del className="font-normal text-[#999] opacity-80">
          <Amount value={compareAtPrice!} className="font-normal text-[#999]" smallSymbol={size === "lg"} />
        </del>
      )}
      <Amount value={price} smallSymbol={size === "lg"} />
    </span>
  );
}
