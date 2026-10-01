import type { Metadata } from "next";
import { CatalogView } from "@/components/shop/catalog-view";

export const metadata: Metadata = {
  title: "Toko",
  description: "Semua produk obat, injeksi, insulin, infus, dan alat kesehatan.",
};

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  return <CatalogView title="Shop" basePath="/shop" searchParams={await searchParams} />;
}
