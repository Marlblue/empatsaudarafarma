import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { cartSummary, getCart } from "@/lib/cart";
import { getCategoryTree } from "@/lib/catalog";
import { formatRupiah } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { BasketIcon, EnvelopeIcon, FacebookIcon, InstagramIcon, TwitterIcon } from "@/components/icons";
import { NewsletterPopup } from "@/components/shop/newsletter-form";
import { MobileNav } from "@/components/shop/mobile-nav";
import { SearchBox } from "@/components/shop/search-box";
import { StickyHeader } from "@/components/shop/sticky-header";

export async function Header() {
  const [settings, user, cart, categories] = await Promise.all([
    getSettings(),
    getCurrentUser(),
    getCart(),
    getCategoryTree(),
  ]);
  const { count, subtotal } = cartSummary(cart);
  const navText = "text-[12.8px] font-bold uppercase tracking-[0.02em] text-[#666]/85 hover:text-ink";

  const cartLink = (
    <Link href="/keranjang" className={`flex items-center gap-2 ${navText}`} aria-label={`Keranjang, ${count} item`}>
      <span className="hidden md:inline">
        Keranjang / {formatRupiah(subtotal).replace("Rp", "Rp ")}
      </span>
      <span className="relative text-[#666]">
        <BasketIcon className="h-[22px] w-[26px]" />
        {count > 0 && (
          <span className="absolute -right-2 -top-2 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-sky px-1 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </span>
    </Link>
  );

  return (
    <StickyHeader>
      <header className="container-page flex h-[70px] items-center gap-3 border-b border-line group-data-[stuck=true]:border-transparent md:h-[90px] md:gap-6 md:group-data-[stuck=true]:h-[70px]">
        <MobileNav
          categories={categories.map((c) => ({ name: c.name, slug: c.slug, children: c.children.map((ch) => ({ name: ch.name, slug: ch.slug })) }))}
          logoUrl={settings.logoUrl}
          storeName={settings.storeName}
          account={user ? { href: isStaff(user.role) ? "/admin" : "/akun", label: "Akun Saya" } : { href: "/masuk", label: "Masuk" }}
        />
        <Link href="/" className="hidden shrink-0 md:block" aria-label={`${settings.storeName} - Beranda`}>
          {settings.logoUrl ? (
            <Image src={settings.logoUrl} alt={settings.storeName} width={250} height={50} priority unoptimized className="h-auto w-[250px] max-w-[26vw]" />
          ) : (
            <span className="text-xl font-bold text-ink">{settings.storeName}</span>
          )}
        </Link>
        <div className="min-w-0 flex-1">
          <Suspense>
            <SearchBox />
          </Suspense>
        </div>
        <nav className="flex items-center">
          <Link
            href={user ? (isStaff(user.role) ? "/admin" : "/akun") : "/masuk"}
            className={`hidden border-r border-line pr-4 md:block ${navText}`}
          >
            {user ? "Akun Saya" : "Masuk / Daftar"}
          </Link>
          <span className="md:pl-4">{cartLink}</span>
        </nav>
      </header>
    </StickyHeader>
  );
}

/** Baris tautan kecil di atas kotak konten (latar biru) */
export async function TopBar() {
  const s = await getSettings();
  const socials = [
    { href: s.facebookUrl, label: "Facebook", icon: "fb" },
    { href: s.instagramUrl, label: "Instagram", icon: "ig" },
    { href: s.twitterUrl, label: "Twitter", icon: "tw" },
    { href: s.email ? `mailto:${s.email}` : "", label: "Email", icon: "em" },
  ].filter((x) => x.href);
  const link = "px-2.5 py-[5px] text-[12.8px] text-ink hover:underline";
  const icons: Record<string, React.ReactNode> = {
    fb: <FacebookIcon />,
    ig: <InstagramIcon />,
    tw: <TwitterIcon />,
    em: <EnvelopeIcon />,
  };
  return (
    <div className="mx-auto mt-[31px] hidden h-[30px] w-full max-w-[1140px] items-center justify-end px-[15px] md:flex">
      <nav className="flex items-center divide-x divide-ink/15">
        <Link href="/" className={link}>Home</Link>
        <Link href="/shop" className={link}>Shop</Link>
        <Link href="/tentang" className={link}>About Us</Link>
        <NewsletterPopup className={`${link} flex items-center gap-1`} />
      </nav>
      <div className="ml-2 flex items-center gap-2 text-ink">
        {socials.map((x) => (
          <a key={x.label} href={x.href} target="_blank" rel="noopener" aria-label={x.label} className="hover:opacity-70">
            {icons[x.icon]}
          </a>
        ))}
      </div>
    </div>
  );
}
