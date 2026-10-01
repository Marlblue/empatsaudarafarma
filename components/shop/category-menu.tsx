import Link from "next/link";
import { getCategoryTree } from "@/lib/catalog";
import { ChevronDown } from "@/components/icons";

/**
 * Menu kategori sidebar seperti amanfarma.com: daftar berbingkai, teks rata tengah,
 * "About Us" di urutan pertama, sub-kategori bisa dibuka.
 */
export async function CategoryMenu({ activeSlug, withHeader = false }: { activeSlug?: string; withHeader?: boolean }) {
  const tree = await getCategoryTree();
  const item = "block px-2 py-[11px] text-center text-[15px] leading-snug text-ink hover:text-cta";

  return (
    <nav aria-label="Kategori produk">
      {withHeader && (
        <h3 className="bg-royal px-2.5 py-2.5 text-center text-xl font-bold text-white">Kategori</h3>
      )}
      <ul className="border border-[#777]">
        <li className="border-b border-[#777]">
          <Link href="/tentang" className={item}>
            About Us
          </Link>
        </li>
        {tree.map((c) => {
          const active = activeSlug === c.slug || c.children.some((ch) => ch.slug === activeSlug);
          return (
            <li key={c.id} className="border-b border-[#777] last:border-b-0">
              {c.children.length > 0 ? (
                <details open={active} className="group">
                  <summary className={`${item} relative cursor-pointer list-none ${active ? "font-bold" : ""}`}>
                    {c.name}
                    <ChevronDown className="absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400 transition group-open:rotate-180" />
                  </summary>
                  <ul className="border-t border-line bg-[#fafafa]">
                    <li>
                      <Link href={`/kategori/${c.slug}`} className={`${item} text-sm ${activeSlug === c.slug ? "font-bold" : ""}`}>
                        Semua {c.name}
                      </Link>
                    </li>
                    {c.children.map((ch) => (
                      <li key={ch.id} className="border-t border-line">
                        <Link href={`/kategori/${ch.slug}`} className={`${item} text-sm ${activeSlug === ch.slug ? "font-bold" : ""}`}>
                          {ch.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                <Link href={`/kategori/${c.slug}`} className={`${item} ${active ? "font-bold" : ""}`}>
                  {c.name}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
