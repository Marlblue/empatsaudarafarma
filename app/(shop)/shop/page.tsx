import type { Metadata } from "next";
import { CatalogView } from "@/components/shop/catalog-view";

export const metadata: Metadata = {
  title: "Toko",
  description: "Semua produk obat, injeksi, insulin, infus, dan alat kesehatan.",
  // CatalogView punya filter/urut/pagination (?sort=, ?page=, dst); canonical ke
  // /shop bersih mencegah varian itu terindeks sebagai halaman duplikat.
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  // "Toko" agar H1 konsisten dengan <title> dan label breadcrumb (sebelumnya "Shop").
  return <CatalogView title="Toko" basePath="/shop" searchParams={await searchParams} />;
}
