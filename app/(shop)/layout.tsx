import { getSettings } from "@/lib/settings";
import { waLink } from "@/lib/format";
import { WhatsAppIcon } from "@/components/icons";
import { Copyright, Footer } from "@/components/shop/footer";
import { Header, TopBar } from "@/components/shop/header";

export default async function ShopLayout({ children }: LayoutProps<"/">) {
  const settings = await getSettings();
  return (
    <>
      <TopBar />
      <div id="wrapper" className="mx-auto flex w-full max-w-[1140px] flex-1 flex-col bg-white">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <Copyright />
      <a
        href={waLink(settings.whatsapp, `Halo ${settings.storeName}, saya ingin bertanya.`)}
        target="_blank"
        rel="noopener"
        className="fixed bottom-4 right-4 z-40 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-wa text-white shadow-[0_1px_6px_rgba(0,0,0,0.06),0_2px_32px_rgba(0,0,0,0.16)] transition hover:scale-105"
        aria-label="Chat WhatsApp"
      >
        <WhatsAppIcon className="h-8 w-8" />
      </a>
    </>
  );
}
