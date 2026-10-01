import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CatalogView } from "@/components/shop/catalog-view";

async function getCategory(slug: string) {
  return db.category.findUnique({
    where: { slug },
    include: { parent: true, children: { select: { id: true } } },
  });
}

export async function generateMetadata({ params }: PageProps<"/kategori/[slug]">): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description ?? `Jual ${category.name} asli dengan harga terbaik.`,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/kategori/[slug]">) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  return (
    <CatalogView
      title={category.name}
      description={category.description}
      basePath={`/kategori/${slug}`}
      searchParams={await searchParams}
      categoryIds={[category.id, ...category.children.map((c) => c.id)]}
      activeCategorySlug={slug}
      breadcrumb={[
        { href: "/shop", label: "Toko" },
        ...(category.parent ? [{ href: `/kategori/${category.parent.slug}`, label: category.parent.name }] : []),
      ]}
    />
  );
}
