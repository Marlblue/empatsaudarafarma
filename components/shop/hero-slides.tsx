import Image from "next/image";
import Link from "next/link";
import type { StoreSettings } from "@/lib/settings";

/**
 * Slide "Cara Pemesanan" ala amanfarma.com, dibuat sebagai HTML (bukan gambar) agar selalu pas di
 * bingkai slider tanpa terpotong. Bingkai selalu 2:1 dan semua ukuran memakai satuan cqw (lebar
 * slide), jadi di HP slide cukup mengecil proporsional seperti gambar slider amanfarma.
 */
export const SLIDE_FRAME = "@container relative block aspect-[2/1] w-full overflow-hidden";

type Bank = StoreSettings["banks"][number] | undefined;
type Thumb = { url: string; alt: string | null };

/** Domain toko untuk ditampilkan di slide; saat lokal (localhost) pakai domain produksi */
function storeHost() {
  try {
    const host = new URL(process.env.SITE_URL ?? "").host.replace(/^www\./, "");
    if (host && !host.startsWith("localhost")) return host;
  } catch {}
  return "empatsaudarafarma.com";
}

function Logo({ className }: { className: string }) {
  return (
    <div className={`relative ${className}`}>
      <Image src="/images/site/logo.png" alt="Empat Saudara Farma" fill sizes="(min-width: 768px) 300px, 40vw" className="object-contain" />
    </div>
  );
}

const MARKETPLACE_SIZES = {
  lg: { gap: "gap-[1.6cqw]", icon: "h-[4.6cqw]", text: "text-[1.25cqw]" },
  sm: { gap: "gap-[1cqw]", icon: "h-[3.8cqw]", text: "text-[1.05cqw]" },
};

function Marketplaces({ size = "lg" }: { size?: keyof typeof MARKETPLACE_SIZES }) {
  const z = MARKETPLACE_SIZES[size];
  return (
    <div className={`flex items-end justify-center ${z.gap}`}>
      <div className="flex flex-col items-center">
        <Image src="/images/site/tokopedia.png" alt="" width={120} height={120} className={`${z.icon} w-auto`} />
        <span className={`${z.text} font-bold text-[#42b549]`}>tokopedia</span>
      </div>
      <div className="flex flex-col items-center">
        <Image src="/images/site/shopee.png" alt="" width={120} height={120} className={`${z.icon} w-auto`} />
        <span className={`${z.text} font-bold text-[#ee4d2d]`}>Shopee</span>
      </div>
    </div>
  );
}

function BankCard({ bank }: { bank: Bank }) {
  if (!bank) return <span className="text-[1.5cqw] font-bold">Transfer Bank</span>;
  return (
    <div className="flex flex-col items-center gap-[0.3cqw]">
      {/^bca$/i.test(bank.bank) ? (
        <Image src="/images/site/bca.png" alt="BCA" width={200} height={70} className="h-[3.4cqw] w-auto" />
      ) : (
        <span className="text-[2.4cqw] font-extrabold text-[#0060af]">{bank.bank}</span>
      )}
      <span className="text-center text-[1.5cqw] font-bold leading-tight text-black">
        {bank.number}
        <br />
        a/n {bank.holder}
      </span>
    </div>
  );
}

/** Slide: mockup HP + judul "Cara Pemesanan" */
export function IntroSlide() {
  return (
    <Link href="/shop" className={`${SLIDE_FRAME} bg-white`}>
      <div className="flex h-full items-center gap-[4cqw] px-[5cqw]">
        {/* Bingkai HP */}
        <div className="relative aspect-[9/18.5] h-[92%] shrink-0 rounded-[3cqw] border-[0.8cqw] border-[#222] bg-[#222] shadow-[0_1cqw_3cqw_rgba(0,0,0,0.25)]">
          <div className="absolute left-1/2 top-0 z-10 h-[1.3cqw] w-[38%] -translate-x-1/2 rounded-b-[0.8cqw] bg-[#222]" />
          <div className="relative h-full w-full overflow-hidden rounded-[2.2cqw] bg-white">
            <Image src="/images/site/hero-phone.jpg" alt="" fill sizes="(min-width: 768px) 270px, 25vw" className="object-cover object-top" />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-stretch gap-[1.8cqw] font-[Arial,sans-serif]">
          <div className="flex flex-col gap-[1.2cqw]">
            <span className="self-start border-[0.35cqw] border-[#4472c4] px-[1.4cqw] py-[0.5cqw] text-[5.4cqw] font-bold leading-none text-black">
              Cara
            </span>
            <span className="self-end border-[0.35cqw] border-[#4472c4] px-[1.4cqw] py-[0.5cqw] text-[5.4cqw] font-bold leading-none text-black">
              Pemesanan
            </span>
          </div>
          <span className="rounded-full bg-[#4472c4] px-[3cqw] py-[1.4cqw] text-center text-[3.2cqw] font-bold leading-none text-white">
            {storeHost()}
          </span>
          <div className="grid grid-cols-2 gap-[2cqw]">
            <div className="flex flex-col items-center gap-[0.6cqw]">
              <span className="text-[1.4cqw] font-bold text-black">Powered by :</span>
              <Logo className="h-[4.6cqw] w-full" />
            </div>
            <div className="flex flex-col items-center gap-[0.6cqw]">
              <span className="text-[1.4cqw] font-bold text-black">COD Available Payment On :</span>
              <Marketplaces />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProductThumb({ thumb }: { thumb?: Thumb }) {
  return (
    <div className="relative aspect-square min-w-0 flex-1 overflow-hidden rounded-[0.4cqw] border border-[#c9d9ea] bg-white">
      {thumb && <Image src={thumb.url} alt={thumb.alt ?? ""} fill sizes="(min-width: 768px) 140px, 15vw" className="object-contain" />}
    </div>
  );
}

function StepBox({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[0.9cqw] border-[0.25cqw] border-[#2f5597] bg-white">
      <div className="flex flex-1 items-center justify-center p-[1cqw]">{children}</div>
      <div className="bg-[#4472c4] px-[0.8cqw] py-[1cqw] text-center text-[1.25cqw] font-bold leading-tight text-white">{caption}</div>
    </div>
  );
}

/** Slide: ringkasan cara pemesanan (checkout → bayar langsung / marketplace) */
export function OverviewSlide({ bank, thumbs }: { bank: Bank; thumbs: Thumb[] }) {
  return (
    <Link href="/shop" className={`${SLIDE_FRAME} flex flex-col bg-[#a9d6fb] font-[Arial,sans-serif]`}>
      <div className="flex h-[19%] shrink-0 items-center justify-center bg-white">
        <Logo className="h-[70%] w-[45%]" />
      </div>
      <div className="flex flex-1 flex-col px-[3cqw] pb-[2cqw] pt-[1.2cqw]">
        <h2 className="text-center text-[2.7cqw] font-bold text-black">Cara Pemesanan :</h2>
        <div className="mt-[1.2cqw] flex flex-1 items-stretch gap-[2cqw]">
          {/* Checkout */}
          <div className="flex w-[42%] flex-col items-center gap-[1cqw]">
            <p className="text-center text-[1.6cqw] font-bold leading-tight text-black">
              Checkout Produk di
              <br />
              <span className="text-[2cqw] text-[#2f5597]">{storeHost()}</span>
            </p>
            <div className="flex w-full flex-1 flex-col justify-center gap-[1.6cqw] rounded-[0.9cqw] border-[0.25cqw] border-[#2f5597] bg-white p-[1.2cqw]">
              <div className="flex gap-[1cqw]">
                {[0, 1, 2].map((i) => (
                  <ProductThumb key={i} thumb={thumbs[i]} />
                ))}
              </div>
              <span className="rounded-[0.5cqw] bg-[#4472c4] py-[0.8cqw] text-center text-[2.4cqw] font-bold text-white">Checkout</span>
            </div>
          </div>

          <svg viewBox="0 0 40 30" className="h-[4cqw] w-[4cqw] shrink-0 self-center fill-[#2f5597]" aria-hidden>
            <path d="M0 9h22V0l18 15-18 15v-9H0z" />
          </svg>

          {/* Pembayaran */}
          <div className="flex flex-1 flex-col items-center gap-[1cqw]">
            <p className="text-center text-[1.6cqw] font-bold leading-tight text-black">
              Metode Pembayaran Langsung
              <br />
              Atau Via Marketplace
            </p>
            <div className="grid w-full flex-1 grid-cols-2 gap-[2cqw]">
              <StepBox caption="Transfer langsung tanpa ribet">
                <BankCard bank={bank} />
              </StepBox>
              <StepBox caption="Akan dibuatkan link produk pembayaran di Tokped / Shopee">
                <Marketplaces />
              </StepBox>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

type Step = { caption: string; visual: React.ReactNode };

const FormVisual = (
  <svg viewBox="0 0 64 56" className="h-[6.6cqw] w-auto" aria-hidden>
    <rect x="2" y="2" width="60" height="44" rx="4" fill="#fff" stroke="#2f5597" strokeWidth="3" />
    <rect x="2" y="2" width="60" height="9" rx="4" fill="#2f5597" />
    <rect x="10" y="17" width="44" height="5" rx="2" fill="#9ec5ee" />
    <rect x="10" y="26" width="44" height="5" rx="2" fill="#9ec5ee" />
    <rect x="18" y="35" width="28" height="6" rx="3" fill="#f08a3c" />
    <path d="M44 38l4 16 3-6 6 5 3-3-5-6 6-2z" fill="#f2c9a0" stroke="#7a4b2a" strokeWidth="1.5" />
  </svg>
);

function IconVisual({ src }: { src: string }) {
  return <Image src={src} alt="" width={160} height={160} className="h-[6.6cqw] w-auto" />;
}

function ThumbVisual({ thumb }: { thumb?: Thumb }) {
  return (
    <div className="relative h-[9cqw] w-[9cqw]">
      {thumb && <Image src={thumb.url} alt="" fill sizes="(min-width: 768px) 120px, 12vw" className="object-contain" />}
    </div>
  );
}

const THEMES = {
  blue: { bg: "bg-[#a9d6fb]", bar: "bg-[#4472c4]", border: "border-[#2f5597]", tag: "bg-[#2f5597]", num: "text-[#2f5597]" },
  green: { bg: "bg-[#bfe8c4]", bar: "bg-[#3a9a48]", border: "border-[#2e7d32]", tag: "bg-[#2e7d32]", num: "text-[#2e7d32]" },
};

/** Slide: lima langkah pemesanan + catatan */
function StepsSlide({
  no,
  title,
  steps,
  notes,
  theme,
  badge,
}: {
  no: number;
  title: string;
  steps: Step[];
  notes: string[];
  theme: keyof typeof THEMES;
  badge?: React.ReactNode;
}) {
  const t = THEMES[theme];
  return (
    <Link href="/shop" className={`${SLIDE_FRAME} flex flex-col ${t.bg} px-[2.4cqw] py-[2cqw] font-[Arial,sans-serif]`}>
      <div className="flex items-center gap-[2cqw]">
        <div className={`flex min-w-0 flex-1 items-center gap-[1.2cqw] rounded-r-full ${t.tag} py-[0.5cqw] pl-[0.5cqw] pr-[2cqw]`}>
          <span className={`flex h-[4.2cqw] w-[4.2cqw] shrink-0 items-center justify-center rounded-full bg-white text-[2.6cqw] font-extrabold ${t.num}`}>
            {no}
          </span>
          <span className="text-[1.75cqw] font-bold leading-tight text-white">{title}</span>
        </div>
        <div className="shrink-0 rounded-[0.5cqw] bg-white px-[1cqw] py-[0.6cqw]">
          <Logo className="h-[3.6cqw] w-[13cqw]" />
        </div>
      </div>

      <ol className="mt-[2cqw] grid flex-1 grid-cols-5 gap-[1.4cqw]">
        {steps.map((s, i) => (
          <li key={i} className={`flex flex-col overflow-hidden rounded-[0.8cqw] border-[0.22cqw] ${t.border} bg-white`}>
            <span className={`${t.bar} py-[0.6cqw] text-center text-[2.8cqw] font-extrabold leading-none text-white`}>{i + 1}</span>
            <div className="flex flex-1 items-center justify-center py-[1cqw]">{s.visual}</div>
            <p className={`flex min-h-[5.6cqw] items-center justify-center ${t.bar} px-[0.8cqw] py-[0.9cqw] text-center text-[1.2cqw] font-bold leading-tight text-white`}>
              {s.caption}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-[1.4cqw] flex items-end gap-[2cqw]">
        <div className="min-w-0 flex-1 italic text-[#1f2a44]">
          <p className="text-[2.2cqw] font-extrabold leading-none">Note:</p>
          <ol className="mt-[0.6cqw] list-decimal pl-[2cqw] text-[1.15cqw] font-semibold leading-snug">
            {notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ol>
        </div>
        {badge}
      </div>
    </Link>
  );
}

const CodBadge = (
  <div className="flex shrink-0 -rotate-6 flex-col items-center rounded-[0.6cqw] border-[0.3cqw] border-[#c62828] bg-white px-[1.4cqw] py-[0.5cqw] font-extrabold leading-none text-[#c62828] shadow">
    <span className="text-[3.4cqw]">COD</span>
    <span className="text-[1.1cqw] tracking-wider">CASH ON DELIVERY</span>
  </div>
);

export function DirectPaymentSlide({ settings, thumb }: { settings: StoreSettings; thumb?: Thumb }) {
  const bank = settings.banks[0];
  const host = storeHost();
  return (
    <StepsSlide
      no={1}
      title="Cara Pemesanan Dengan Metode Pembayaran Langsung :"
      theme="blue"
      steps={[
        { caption: `Checkout Produk di ${host}`, visual: <ThumbVisual thumb={thumb} /> },
        { caption: "Isi data alamat & pilih kurir pengiriman", visual: FormVisual },
        { caption: "Lakukan pembayaran melalui bank transfer", visual: <div className="scale-[0.85]"><BankCard bank={bank} /></div> },
        { caption: "Kirim bukti pembayaran di halaman pesanan / WhatsApp", visual: <IconVisual src="/images/site/icon-whatsapp.png" /> },
        { caption: "Pesanan segera dikirim", visual: <IconVisual src="/images/site/icon-delivery.png" /> },
      ]}
      notes={storeNotes(settings)}
    />
  );
}

export function MarketplaceSlide({ settings, thumb }: { settings: StoreSettings; thumb?: Thumb }) {
  const host = storeHost();
  return (
    <StepsSlide
      no={2}
      title="Cara Pemesanan Dengan Metode Via Marketplace :"
      theme="green"
      steps={[
        { caption: `Checkout Produk di ${host}`, visual: <ThumbVisual thumb={thumb} /> },
        { caption: "Isi data alamat & pilih kurir pengiriman", visual: FormVisual },
        { caption: "Lakukan konfirmasi pesanan via WhatsApp", visual: <IconVisual src="/images/site/icon-whatsapp.png" /> },
        { caption: "Checkout produk di marketplace", visual: <Marketplaces size="sm" /> },
        { caption: "Pesanan segera dikirim", visual: <IconVisual src="/images/site/icon-delivery.png" /> },
      ]}
      notes={storeNotes(settings)}
      badge={settings.codEnabled ? CodBadge : undefined}
    />
  );
}

/** Catatan diambil dari Pengaturan Toko agar tidak menjanjikan hal yang tidak berlaku */
function storeNotes(s: StoreSettings) {
  return [
    `Jam operasional: ${s.hours}`,
    `Konfirmasi & tanya pesanan via WhatsApp ${s.csName ? `CS. ${s.csName} ` : ""}${s.whatsapp}`,
    `Pembayaran transfer ditunggu maksimal ${s.paymentDueHours} jam setelah checkout`,
  ];
}
