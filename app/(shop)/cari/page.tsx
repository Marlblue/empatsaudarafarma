import type { Metadata } from "next";
import { CatalogView } from "@/components/shop/catalog-view";

export async function generateMetadata({ searchParams }: PageProps<"/cari">): Promise<Metadata> {
  const q = (await searchParams).q;
  return { title: q ? `Hasil pencarian “${q}”` : "Cari Produk", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: PageProps<"/cari">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  return (
    <CatalogView
      title={q ? `Hasil pencarian “${q}”` : "Cari Produk"}
      basePath="/cari"
      searchParams={sp}
    />
  );
}
