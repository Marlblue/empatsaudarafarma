import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { breadcrumbJsonLd, categoryMetaDescription, categoryMetaTitle } from "@/lib/seo";
import { CatalogView } from "@/components/shop/catalog-view";

// cache(): generateMetadata dan komponen halaman sama-sama memanggil getCategory
// untuk slug yang sama dalam satu request, jadi cukup satu query ke database.
const getCategory = cache(async (slug: string) =>
  db.category.findUnique({
    where: { slug },
    include: { parent: true, children: { select: { id: true } } },
  }),
);

export async function generateMetadata({ params }: PageProps<"/kategori/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return {};
  const settings = await getSettings();
  return {
    title: categoryMetaTitle(category.name, settings.storeName),
    description: category.description ?? categoryMetaDescription(category.name, settings),
    // Tanpa canonical, URL terfilter/terurut/berhalaman (?sort=, ?page=, dst) dari
    // CatalogView bisa terindeks sebagai halaman duplikat. Tunjuk ke URL kategori bersih.
    alternates: { canonical: `/kategori/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/kategori/[slug]">) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const breadcrumb = breadcrumbJsonLd([
    { name: "Beranda", url: siteUrl },
    { name: "Toko", url: `${siteUrl}/shop` },
    ...(category.parent ? [{ name: category.parent.name, url: `${siteUrl}/kategori/${category.parent.slug}` }] : []),
    { name: category.name, url: `${siteUrl}/kategori/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c") }}
      />
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
    </>
  );
}
