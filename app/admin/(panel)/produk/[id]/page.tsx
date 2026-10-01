import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProduct, duplicateProduct } from "@/app/admin/actions/products";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { categoryOptions } from "@/lib/admin-data";
import { Flash, PageHeader } from "@/components/admin/page-header";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "Edit Produk" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/produk/[id]">) {
  await requireStaff();
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } }, categories: true },
    }),
    categoryOptions(),
  ]);
  if (!product) notFound();

  const { images, categories: productCategories, ...rest } = product;

  return (
    <>
      <PageHeader
        title={product.name}
        back={{ href: "/admin/produk", label: "Daftar produk" }}
        actions={
          <>
            <Link href={`/produk/${product.slug}`} target="_blank" className="btn-outline">
              {product.status === "PUBLISHED" ? "Lihat di toko ↗" : "Pratinjau (draft tidak tampil)"}
            </Link>
            <form action={duplicateProduct.bind(null, product.id)}>
              <SubmitButton className="btn-outline" pendingText="Menduplikat...">Duplikat</SubmitButton>
            </form>
            <form action={deleteProduct.bind(null, product.id)}>
              <ConfirmButton message={`Hapus produk "${product.name}"?`} className="btn-danger">Hapus</ConfirmButton>
            </form>
          </>
        }
      />
      <Flash searchParams={await searchParams} />
      <ProductForm
        key={product.updatedAt.toISOString()}
        categories={categories}
        product={{
          ...rest,
          images: images.map((i) => ({ id: i.id, url: i.url })),
          categoryIds: productCategories.map((c) => c.categoryId),
        }}
      />
    </>
  );
}
