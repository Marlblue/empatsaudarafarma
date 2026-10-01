import Link from "next/link";
import { Suspense } from "react";
import { listProducts, parseSort, PER_PAGE, SORT_OPTIONS } from "@/lib/catalog";
import { ProductGrid } from "@/components/product-card";
import { CategoryMenu } from "@/components/shop/category-menu";
import { SortSelect } from "@/components/shop/sort-select";

export type CatalogSearchParams = { [key: string]: string | string[] | undefined };

function str(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export function parseCatalogParams(sp: CatalogSearchParams) {
  return {
    sort: parseSort(str(sp.sort)),
    page: Math.max(1, Number(str(sp.page)) || 1),
    minPrice: Number(str(sp.min)) || undefined,
    maxPrice: Number(str(sp.max)) || undefined,
    inStock: str(sp.stok) === "1",
    q: str(sp.q)?.trim().slice(0, 100) || undefined,
  };
}

function buildHref(basePath: string, sp: CatalogSearchParams, patch: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    const value = str(v);
    if (value) params.set(k, value);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v) params.set(k, v);
    else params.delete(k);
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export async function CatalogView({
  title,
  description,
  basePath,
  searchParams,
  categoryIds,
  activeCategorySlug,
  breadcrumb,
}: {
  title: string;
  description?: string | null;
  basePath: string;
  searchParams: CatalogSearchParams;
  categoryIds?: string[];
  activeCategorySlug?: string;
  breadcrumb?: { href: string; label: string }[];
}) {
  const opts = parseCatalogParams(searchParams);
  const result = await listProducts({ ...opts, categoryIds });
  const from = result.total === 0 ? 0 : (result.page - 1) * PER_PAGE + 1;
  const to = Math.min(result.page * PER_PAGE, result.total);
  const pages = pageNumbers(result.page, result.totalPages);
  const circle = "flex h-[34px] min-w-[34px] items-center justify-center rounded-full border-2 px-[7px] text-[15px] font-bold";

  return (
    <div className="container-page pb-10 pt-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Breadcrumb" className="text-[18.4px] font-bold uppercase text-[#222]">
          <Link href="/" className="font-normal text-[#999] hover:text-[#222]">Beranda</Link>
          {(breadcrumb ?? []).map((b) => (
            <span key={b.href}>
              <span className="mx-2 font-normal text-[#bbb]">/</span>
              <Link href={b.href} className="font-normal text-[#999] hover:text-[#222]">{b.label}</Link>
            </span>
          ))}
          <span className="mx-2 font-normal text-[#bbb]">/</span>
          <span>{title}</span>
        </nav>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <p className="text-[15px]">
            Menampilkan {from}–{to} dari {result.total} hasil
          </p>
          <Suspense>
            <SortSelect value={opts.sort} options={SORT_OPTIONS} />
          </Suspense>
        </div>
      </div>

      <div className="grid gap-[30px] md:grid-cols-[255px_1fr]">
        <aside className="space-y-6 max-md:order-2">
          <CategoryMenu activeSlug={activeCategorySlug} />
          <form action={basePath} className="space-y-3 border border-line p-4">
            <p className="text-sm font-bold uppercase tracking-wide text-heading">Filter Harga</p>
            {opts.q && <input type="hidden" name="q" value={opts.q} />}
            <input type="hidden" name="sort" value={opts.sort} />
            <div className="flex items-center gap-2">
              <input name="min" type="number" min={0} placeholder="Min" defaultValue={opts.minPrice} className="input" aria-label="Harga minimum" />
              <span>–</span>
              <input name="max" type="number" min={0} placeholder="Maks" defaultValue={opts.maxPrice} className="input" aria-label="Harga maksimum" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="stok" value="1" defaultChecked={opts.inStock} className="h-4 w-4 accent-ink" />
              Hanya yang tersedia
            </label>
            <div className="flex gap-2">
              <button className="btn-primary flex-1 py-2">Filter</button>
              <Link href={buildHref(basePath, {}, { q: opts.q })} className="btn-outline py-2">Reset</Link>
            </div>
          </form>
        </aside>

        <div>
          {description && <p className="mb-6">{description}</p>}
          {result.products.length > 0 ? (
            <ProductGrid products={result.products} />
          ) : (
            <p className="border border-line bg-[#f9f9f9] p-6">Tidak ada produk yang ditemukan sesuai pilihan Anda.</p>
          )}

          {result.totalPages > 1 && (
            <nav aria-label="Halaman" className="mt-6 flex flex-wrap justify-center gap-2">
              {pages.map((p, i) =>
                p === null ? (
                  <span key={`gap-${i}`} className={`${circle} border-[#777] text-body`}>…</span>
                ) : p === result.page ? (
                  <span key={p} aria-current="page" className={`${circle} border-sky bg-sky text-white`}>{p}</span>
                ) : (
                  <Link
                    key={p}
                    href={buildHref(basePath, searchParams, { page: p === 1 ? undefined : String(p) })}
                    className={`${circle} border-[#777] text-body hover:border-sky hover:bg-sky hover:text-white`}
                  >
                    {p}
                  </Link>
                ),
              )}
              {result.page < result.totalPages && (
                <Link
                  href={buildHref(basePath, searchParams, { page: String(result.page + 1) })}
                  aria-label="Halaman berikutnya"
                  className={`${circle} border-[#777] text-body hover:border-sky hover:bg-sky hover:text-white`}
                >
                  ›
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

/** 1 2 3 4 … 36 37 38 (gaya WooCommerce) */
function pageNumbers(current: number, total: number): (number | null)[] {
  const set = new Set([1, 2, 3, 4, total - 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  for (const [i, p] of sorted.entries()) {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  }
  return out;
}
