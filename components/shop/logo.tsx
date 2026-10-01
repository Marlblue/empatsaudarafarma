import Image from "next/image";
import Link from "next/link";

export function Logo({ name, logoUrl, light = false }: { name: string; logoUrl?: string; light?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${name} - Beranda`}>
      {logoUrl ? (
        <Image src={logoUrl} alt={name} width={160} height={48} unoptimized className="h-10 w-auto object-contain" />
      ) : (
        <>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span className={`text-lg font-extrabold leading-tight ${light ? "text-white" : "text-brand-800"}`}>
            {name}
          </span>
        </>
      )}
    </Link>
  );
}
