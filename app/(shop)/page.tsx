import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { productCardSelect } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";
import { CategoryMenu } from "@/components/shop/category-menu";
import { ProductGrid } from "@/components/product-card";

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
  const [settings, latest] = await Promise.all([
    getSettings(),
    db.product.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 9,
      select: productCardSelect,
    }),
  ]);

  return (
    <>
      <h1 className="sr-only">
        {settings.storeName} — {settings.tagline}
      </h1>

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
