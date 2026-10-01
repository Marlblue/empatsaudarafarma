import Image from "next/image";

/** Gambar produk dengan placeholder bila produk belum punya foto */
export function ProductImage({
  src,
  alt,
  className = "",
  sizes = "(min-width: 1024px) 20vw, 50vw",
  priority,
  fit = "contain",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fit?: "contain" | "cover";
}) {
  if (!src) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center bg-[#f7f7f7] text-[#ccc] ${className}`}
        aria-label={alt}
        role="img"
      >
        <svg viewBox="0 0 24 24" className="h-1/3 w-1/3" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M12 11v6M9 14h6" />
        </svg>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={src.startsWith("/uploads/")}
      className={`${fit === "cover" ? "object-cover" : "object-contain"} ${className}`}
    />
  );
}
