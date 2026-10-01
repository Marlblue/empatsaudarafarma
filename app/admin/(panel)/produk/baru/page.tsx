import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { categoryOptions } from "@/lib/admin-data";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Tambah Produk" };

export default async function NewProductPage() {
  await requireStaff();
  return (
    <>
      <PageHeader title="Tambah Produk" back={{ href: "/admin/produk", label: "Daftar produk" }} />
      <ProductForm categories={await categoryOptions()} />
    </>
  );
}
