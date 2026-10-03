import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import type { StoreSettings } from "@/lib/settings";
import { Carousel } from "@/components/shop/carousel";
import { DirectPaymentSlide, IntroSlide, MarketplaceSlide, OverviewSlide, SLIDE_FRAME as SLIDE } from "@/components/shop/hero-slides";

/**
 * Slider homepage (promo + "Cara Pemesanan" + banner dari admin).
 * Sementara tidak dipasang atas permintaan client; tampilkan lagi dengan
 * `<HomeSlider settings={settings} thumbs={thumbs} />` di app/(shop)/page.tsx.
 */
export async function HomeSlider({ settings, thumbs }: { settings: StoreSettings; thumbs: { url: string; alt: string | null }[] }) {
  const banners = await db.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  const hero = settings.features[0];
  return (
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
  );
}

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
