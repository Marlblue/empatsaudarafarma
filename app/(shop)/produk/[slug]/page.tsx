import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { getProductBySlug, getRelatedProducts, isInStock } from "@/lib/catalog";
import { formatDateTime, formatRupiah, waLink } from "@/lib/format";
import { ADDRESS_REQUEST } from "@/lib/whatsapp";
import { getSettings } from "@/lib/settings";
import { breadcrumbJsonLd, productMetaDescription, productMetaTitle } from "@/lib/seo";
import { AddToCartForm } from "@/components/add-to-cart";
import { EnvelopeIcon, FacebookIcon, LinkedInIcon, PinterestIcon, TwitterIcon, WhatsAppIcon } from "@/components/icons";
import { Price } from "@/components/price";
import { ProductGrid } from "@/components/product-card";
import { RichText } from "@/components/rich-text";
import { ProductGallery } from "@/components/shop/product-gallery";
import { ReviewForm } from "@/components/shop/review-form";

const getProduct = cache(getProductBySlug);

export async function generateMetadata({ params }: PageProps<"/produk/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  const settings = await getSettings();
  const description =
    product.metaDescription ?? product.shortDescription ?? productMetaDescription(product, settings);
  return {
    title: product.metaTitle ?? productMetaTitle(product, settings.storeName),
    description,
    alternates: { canonical: `/produk/${product.slug}` },
    openGraph: { title: product.name, description, images: product.images[0] ? [product.images[0].url] : [] },
  };
}

/** Produk sebelum/sesudah berdasarkan urutan "terbaru" */
async function neighbours(createdAt: Date) {
  const select = { slug: true, name: true } as const;
  const [prev, next] = await Promise.all([
    db.product.findFirst({ where: { status: "PUBLISHED", createdAt: { gt: createdAt } }, orderBy: { createdAt: "asc" }, select }),
    db.product.findFirst({ where: { status: "PUBLISHED", createdAt: { lt: createdAt } }, orderBy: { createdAt: "desc" }, select }),
  ]);
  return { prev, next };
}

export default async function ProductPage({ params }: PageProps<"/produk/[slug]">) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const product = await getProduct(slug, !!user && isStaff(user.role));
  if (!product) notFound();

  const [settings, related, nav] = await Promise.all([
    getSettings(),
    getRelatedProducts(product.id, product.categories.map((c) => c.categoryId)),
    neighbours(product.createdAt),
  ]);

  const category = product.categories[0]?.category;
  const inStock = isInStock(product);
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";
  const productUrl = `${siteUrl}/produk/${product.slug}`;
  const avgRating = product.reviews.length
    ? product.reviews.reduce((n, r) => n + r.rating, 0) / product.reviews.length
    : 0;

  const specs = [
    ["Nama Produk", product.genericName],
    ["Bentuk Sediaan", product.dosageForm],
    ["Komposisi", product.activeIngredient],
    ["Merk", product.brand],
    ["Kemasan", product.packaging],
    ["Pendaftar", product.registrant],
    ["Diproduksi Oleh", product.manufacturer],
    ["No. BPOM", product.bpomNumber],
  ].filter((row): row is [string, string] => Boolean(row[1]));

  const waText =
    `Halo ${settings.storeName}, saya ingin memesan:\n\n${product.name}\nHarga: ${formatRupiah(product.price)} (belum termasuk ongkir)\n${productUrl}` +
    `\n\nJumlah: \n\n${ADDRESS_REQUEST}`;
  const shareText = encodeURIComponent(product.name);
  const shareUrl = encodeURIComponent(productUrl);
  const shares = [
    { label: "Bagikan ke Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, icon: <FacebookIcon /> },
    { label: "Bagikan ke Twitter", href: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`, icon: <TwitterIcon /> },
    { label: "Kirim lewat email", href: `mailto:?subject=${shareText}&body=${shareUrl}`, icon: <EnvelopeIcon /> },
    { label: "Pin di Pinterest", href: `https://pinterest.com/pin/create/button/?url=${shareUrl}&description=${shareText}`, icon: <PinterestIcon /> },
    { label: "Bagikan ke LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, icon: <LinkedInIcon /> },
    { label: "Bagikan ke WhatsApp", href: `https://wa.me/?text=${shareText}%20${shareUrl}`, icon: <WhatsAppIcon className="h-3.5 w-3.5" /> },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku ?? undefined,
    image: product.images.map((i) => i.url),
    description: product.shortDescription ?? product.description ?? undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "IDR",
      price: product.price,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: productUrl,
    },
    ...(product.reviews.length > 0 && {
      aggregateRating: { "@type": "AggregateRating", ratingValue: avgRating.toFixed(1), reviewCount: product.reviews.length },
    }),
  };

  const breadcrumb = breadcrumbJsonLd([
    { name: "Beranda", url: siteUrl },
    ...(category ? [{ name: category.name, url: `${siteUrl}/kategori/${category.slug}` }] : []),
    { name: product.name, url: productUrl },
  ]);

  const circleBtn = "flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#ddd] text-[#bbb] hover:border-ink hover:bg-ink hover:text-white";

  return (
    <div className="container-page pb-4 pt-[30px] md:pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumb]).replace(/</g, "\\u003c") }}
      />
      {product.status === "DRAFT" && (
        <p className="mb-4 bg-amber-50 p-3 text-sm font-bold text-amber-800">
          Pratinjau admin: produk ini berstatus Draft dan tidak terlihat oleh pengunjung.
        </p>
      )}

      <div className="grid gap-8 md:grid-cols-12 md:gap-[30px]">
        <div className="md:col-span-6">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        <div className="md:col-span-5 lg:col-span-4">
          <nav aria-label="Breadcrumb" className="text-[13.6px] uppercase text-[#777]">
            <Link href="/" className="hover:text-[#222]">Beranda</Link>
            {category && (
              <>
                <span className="mx-1.5 text-[#bbb]">/</span>
                <Link href={`/kategori/${category.slug}`} className="hover:text-[#222]">{category.name}</Link>
              </>
            )}
          </nav>
          <h1 className="mt-2 text-[27.2px] font-bold leading-[1.3] text-heading">{product.name}</h1>
          <div className="divider" />
          <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
          {product.reviews.length > 0 && (
            <p className="mt-2 text-sm">
              <span className="text-amber-400">★</span> {avgRating.toFixed(1)} ({product.reviews.length} ulasan)
            </p>
          )}

          {(specs.length > 0 || product.shortDescription || product.description) && (
            <div className="mt-8 text-[14.4px] text-[#666]">
              {product.shortDescription && <p className="mb-4">{product.shortDescription}</p>}
              {specs.length > 0 && (
                <table className="mb-4 w-full">
                  <tbody>
                    {specs.map(([label, value]) => (
                      <tr key={label} className="border-b border-line">
                        <th className="w-[130px] py-[7px] pr-2 text-left align-top font-bold text-[#555]">{label}</th>
                        <td className="py-[7px]">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {product.description && <RichText text={product.description} className="text-[14.4px] text-[#666]" />}
            </div>
          )}

          {product.requiresPrescription && (
            <p className="mb-4 border-l-4 border-red-400 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              Obat keras — wajib resep dokter. Admin akan meminta resep sebelum pesanan diproses.
            </p>
          )}

          <div className="mt-4">
            <AddToCartForm
              productId={product.id}
              maxQuantity={product.trackStock ? product.stock : null}
              price={product.price}
              weightGram={product.weightGram}
            />
          </div>
          <a
            href={waLink(settings.whatsapp, waText)}
            target="_blank"
            rel="noopener"
            className="mt-4 inline-flex items-center gap-2 border border-wa px-4 py-2 text-sm font-bold uppercase text-[#1a9e4b] hover:bg-wa hover:text-white"
          >
            <WhatsAppIcon className="h-4 w-4" /> Pesan via WhatsApp
          </a>

          {product.categories.length > 0 && (
            <p className="mt-6 border-t border-dotted border-[#ddd] py-[5px] text-[12.8px]">
              Kategori:{" "}
              {product.categories.map((c, i) => (
                <span key={c.categoryId}>
                  {i > 0 && ", "}
                  <Link href={`/kategori/${c.category.slug}`} className="text-[#333] hover:text-cta">
                    {c.category.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {shares.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener nofollow" aria-label={s.label} title={s.label} className={circleBtn}>
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <div className="hidden justify-end gap-1.5 lg:col-span-2 lg:flex">
          {nav.prev && (
            <Link href={`/produk/${nav.prev.slug}`} title={nav.prev.name} aria-label="Produk sebelumnya" className={circleBtn}>
              ‹
            </Link>
          )}
          {nav.next && (
            <Link href={`/produk/${nav.next.slug}`} title={nav.next.name} aria-label="Produk berikutnya" className={circleBtn}>
              ›
            </Link>
          )}
        </div>
      </div>

      <section className="mt-12 border-t border-line pt-4">
        <h2 className="py-[15px] text-xl font-bold uppercase tracking-[0.05em] text-heading">
          Ulasan ({product.reviews.length})
        </h2>
        <div className="grid max-w-3xl gap-5">
          {product.reviews.length === 0 && <p>Belum ada ulasan untuk produk ini.</p>}
          {product.reviews.map((r) => (
            <div key={r.id} className="border-b border-line pb-4">
              <p className="text-amber-400">
                {"★".repeat(r.rating)}
                <span className="text-gray-300">{"★".repeat(5 - r.rating)}</span>
              </p>
              <p className="mt-1 text-sm font-bold text-[#333]">
                {r.user.name} <span className="font-normal text-[#999]">– {formatDateTime(r.createdAt)}</span>
              </p>
              <p className="mt-1 text-sm">{r.comment}</p>
            </div>
          ))}
          {user ? (
            <ReviewForm productId={product.id} />
          ) : (
            <p className="text-sm">
              <Link href={`/masuk?next=/produk/${product.slug}`} className="font-bold text-ink underline">
                Masuk
              </Link>{" "}
              untuk menulis ulasan.
            </p>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-10 border-t border-line pt-4">
          <h2 className="py-[15px] text-xl font-bold uppercase tracking-[0.05em] text-heading">Produk Terkait</h2>
          <ProductGrid products={related.slice(0, 4)} columns={4} />
        </section>
      )}
    </div>
  );
}
