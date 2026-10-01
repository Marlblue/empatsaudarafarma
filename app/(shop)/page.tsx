import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { productCardSelect } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { Carousel } from "@/components/shop/carousel";
import { CategoryMenu } from "@/components/shop/category-menu";
import { ProductGrid } from "@/components/product-card";
import { DirectPaymentSlide, IntroSlide, MarketplaceSlide, OverviewSlide, SLIDE_FRAME as SLIDE } from "@/components/shop/hero-slides";

function HeroSlide({ title, subtitle, tokopediaUrl, shopeeUrl }: { title: string; subtitle: string; tokopediaUrl: string; shopeeUrl: string }) {
  return (
    <div className={SLIDE}>
      <Image src="/images/site/hero-bg.jpeg" alt="" fill priority sizes="1140px" className="scale-110 object-cover blur-[10px]" />
      <div className="absolute inset-0 bg-white/20" />
      <div className="relative flex h-full flex-col items-center justify-center gap-[1.2%] px-4 text-center font-display text-black">
        <h1 className="text-[3.95cqw] font-bold leading-tight">{title}</h1>
        <p className="text-[3.25cqw] font-bold leading-tight">{subtitle}</p>
        <div className="my-[1%] flex w-full items-center justify-center gap-[4%]">
          <a href={tokopediaUrl} target="_blank" rel="noopener" className="w-[28%]">
            <Image src="/images/site/tokopedia-wordmark.png" alt="Tokopedia" width={1000} height={300} className="h-auto w-full" />
          </a>
          <a href={shopeeUrl} target="_blank" rel="noopener" className="w-[27%]">
            <Image src="/images/site/shopee-wordmark.png" alt="Shopee" width={1280} height={410} className="h-auto w-full" />
          </a>
        </div>
        <p className="text-[1.7cqw] font-extrabold italic">*Syarat &amp; Ketentuan Berlaku</p>
        <Link
          href="/shop"
          className="mt-[2%] rounded-[5px] bg-cta px-[0.33em] py-[0.33em] text-[2.7cqw] font-semibold leading-[1.5] text-white hover:brightness-110"
        >
          Belanja Sekarang
        </Link>
      </div>
    </div>
  );
}

function PromoBanner({ image, title, href }: { image: string; title: string; href: string }) {
  return (
    <Link href={href} className="group relative block aspect-[560/236] overflow-hidden">
      <Image src={image} alt="" fill sizes="(min-width: 768px) 560px, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
        <h2 className="text-[clamp(22px,2.6vw,29px)] font-semibold text-black">{title}</h2>
        <span className="border-2 border-black px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.05em] text-black transition group-hover:bg-black group-hover:text-white">
          Belanja Sekarang
        </span>
      </div>
    </Link>
  );
}

const SERVICE_ICONS = ["/images/site/icon-support.png", "/images/site/icon-quality.png", "/images/site/icon-delivery.png"];

export default async function HomePage() {
  const [settings, banners, latest] = await Promise.all([
    getSettings(),
    db.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 9,
      select: productCardSelect,
    }),
  ]);
  const hero = settings.features[0];
  const thumbs = latest.flatMap((p) => p.images.slice(0, 1));

  return (
    <>
      <Carousel interval={8000}>
        {hero && (
          <HeroSlide
            title={hero.title}
            subtitle={hero.text}
            tokopediaUrl={settings.tokopediaUrl}
            shopeeUrl={settings.shopeeUrl}
          />
        )}
        <IntroSlide />
        <OverviewSlide bank={settings.banks[0]} thumbs={thumbs} />
        <DirectPaymentSlide settings={settings} thumb={thumbs[0]} />
        <MarketplaceSlide settings={settings} thumb={thumbs[0]} />
        {banners.map((b) => {
          // Gambar ditampilkan utuh (contain) di atas salinan buram sebagai latar, jadi tidak terpotong
          const img = (
            <>
              <Image src={b.imageDesktop} alt="" fill unoptimized sizes="1140px" className="scale-110 object-cover blur-xl" />
              <picture>
                {b.imageMobile && <source media="(max-width: 767px)" srcSet={b.imageMobile} />}
                <Image src={b.imageDesktop} alt={b.title ?? "Banner"} fill unoptimized sizes="1140px" className="object-contain" />
              </picture>
            </>
          );
          return b.link ? (
            <Link key={b.id} href={b.link} className={SLIDE}>
              {img}
            </Link>
          ) : (
            <div key={b.id} className={SLIDE}>
              {img}
            </div>
          );
        })}
      </Carousel>

      <section className="container-page pt-10 md:pt-14">
        <div className="mb-8 flex items-center gap-0">
          <span className="h-px flex-1 bg-black" />
          <h2 className="border border-[#777] bg-white px-4 py-1.5 text-[clamp(20px,2.2vw,25.6px)] font-medium leading-none text-black">
            Produk
          </h2>
          <span className="h-px flex-1 bg-black" />
        </div>
        <div className="grid gap-8 md:grid-cols-[265px_1fr]">
          <aside className="hidden md:block">
            <CategoryMenu withHeader />
          </aside>
          <ProductGrid products={latest} center />
        </div>
      </section>

      <section className="mt-10 grid gap-[15px] md:grid-cols-2">
        <PromoBanner image="/images/site/best-seller-drugs.jpg" title="BEST SELLER" href="/shop?sort=popular" />
        <PromoBanner image="/images/site/new-arrival-drugs.jpg" title="NEW ARRIVAL" href="/shop?sort=newest" />
      </section>

      <section className="container-page grid gap-10 py-14 md:grid-cols-3 md:px-[60px]">
        {settings.services.map((s, i) => (
          <div key={s.title} className="flex items-start gap-5">
            <Image src={SERVICE_ICONS[i % SERVICE_ICONS.length]} alt="" width={64} height={64} className="h-16 w-16 shrink-0 opacity-80" />
            <div>
              <h3 className="font-[Roboto,sans-serif] text-xl font-medium text-[#54595f]">{s.title}</h3>
              <p className="mt-2 leading-relaxed">{s.text}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
