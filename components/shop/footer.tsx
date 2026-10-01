import Image from "next/image";
import Link from "next/link";
import { getSettings } from "@/lib/settings";

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-semibold uppercase leading-[1.05] tracking-[0.05em] text-body">{title}</h3>
      <div className="divider mb-5 mt-3 h-[2px]" />
      {children}
    </div>
  );
}

export async function Footer() {
  const s = await getSettings();
  return (
    <footer className="border-t border-black/5 bg-white pb-8 pt-[30px]">
      <div className="container-page grid gap-8 text-[15px] sm:grid-cols-2 lg:grid-cols-[1.1fr_1.2fr_1.2fr_1fr_1.2fr]">
        <div>
          {s.logoUrl ? (
            <Image src={s.logoUrl} alt={s.storeName} width={160} height={51} unoptimized className="h-auto w-[180px]" />
          ) : (
            <p className="text-lg font-bold text-ink">{s.storeName}</p>
          )}
        </div>
        <Column title="Customer Support">
          <p className="flex gap-2">
            <Image src="/images/site/icon-whatsapp.png" alt="" width={16} height={16} unoptimized className="mt-1 h-4 w-4 shrink-0" />
            <span>
              {s.csName ? `${s.csName} – ` : ""}
              {s.whatsapp} (Wa Only) {s.hours}
            </span>
          </p>
          {s.email && (
            <p className="mt-6 flex items-center gap-1.5 text-[13px]">
              <Image src="/images/site/icon-email.png" alt="" width={16} height={16} unoptimized className="h-4 w-4 shrink-0" />
              <a href={`mailto:${s.email}`} className="hover:text-ink">
                {s.email}
              </a>
            </p>
          )}
        </Column>
        <Column title="Pembayaran Rekening">
          {s.banks.length === 0 && <p>Info rekening via WhatsApp {s.whatsapp}</p>}
          {s.banks.map((b) => (
            <div key={b.bank + b.number} className="mb-3">
              {b.bank.toUpperCase() === "BCA" ? (
                <Image src="/images/site/bca.png" alt="BCA" width={90} height={32} unoptimized className="mb-1 h-auto w-[90px]" />
              ) : (
                <p className="font-bold text-ink">{b.bank}</p>
              )}
              <p>No. Rek: {b.number}</p>
              <p>Atas Nama : {b.holder}</p>
            </div>
          ))}
        </Column>
        <Column title="Pengiriman">
          <Image src="/images/site/kurir.png" alt="J&T, JNE, SiCepat, Grab" width={90} height={41} unoptimized className="h-auto w-[90px]" />
        </Column>
        <Column title="Temukan Kami Di">
          <div className="flex gap-3">
            {s.tokopediaUrl && (
              <a href={s.tokopediaUrl} target="_blank" rel="noopener" aria-label="Tokopedia">
                <Image src="/images/site/tokopedia.png" alt="Tokopedia" width={52} height={52} unoptimized />
              </a>
            )}
            {s.shopeeUrl && (
              <a href={s.shopeeUrl} target="_blank" rel="noopener" aria-label="Shopee">
                <Image src="/images/site/shopee.png" alt="Shopee" width={52} height={52} unoptimized />
              </a>
            )}
          </div>
        </Column>
      </div>
    </footer>
  );
}

/** Baris copyright di luar kotak konten */
export async function Copyright() {
  const s = await getSettings();
  return (
    <div className="px-4 pb-[15px] pt-[10px] text-center text-[14.4px] text-black/50">
      <p>
        Copyright {new Date().getFullYear()} © {s.storeName}
      </p>
      <p className="mt-1 flex flex-wrap justify-center gap-x-3 text-[12.5px]">
        <Link href="/cara-belanja" className="hover:text-black/80">Cara Belanja</Link>
        <Link href="/kontak" className="hover:text-black/80">Kontak</Link>
        <Link href="/kebijakan-privasi" className="hover:text-black/80">Kebijakan Privasi</Link>
        <Link href="/syarat-ketentuan" className="hover:text-black/80">Syarat & Ketentuan</Link>
        {s.licenseInfo && <span>{s.licenseInfo}</span>}
      </p>
    </div>
  );
}
