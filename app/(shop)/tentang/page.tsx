import type { Metadata } from "next";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { RichText } from "@/components/rich-text";
import { ContactForm } from "../kontak/contact-form";

export const metadata: Metadata = { title: "About Us", alternates: { canonical: "/tentang" } };

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mt-14">
      <h2 className="border-b border-[#777] pb-2 text-xl text-[#54595f]">{title}</h2>
      <div className="pt-5">{children}</div>
    </section>
  );
}

export default async function AboutPage() {
  const s = await getSettings();
  const mapSrc = s.mapEmbedUrl.startsWith("https://www.google.com/maps/embed")
    ? s.mapEmbedUrl
    : `https://maps.google.com/maps?q=${encodeURIComponent(s.address)}&output=embed`;

  return (
    <div className="container-page pb-16 pt-8">
      <h1 className="text-[27px] font-bold text-heading">About Us</h1>
      {s.aboutContent && <RichText text={s.aboutContent} className="mt-6 text-[15px] text-body" />}

      <Section title="Jam Operasional">
        <p>{s.hours}</p>
      </Section>

      <Section title="Cara Belanja">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Cari produk lewat kolom pencarian atau menu kategori, lalu klik “Tambah ke Keranjang”.</li>
          <li>Buka keranjang, klik “Checkout”, masuk atau daftar akun, lalu isi alamat pengiriman.</li>
          <li>Pilih pembayaran Transfer Bank atau COD (bayar di tempat).</li>
          <li>Untuk transfer, unggah bukti pembayaran di halaman pesanan. Nomor resi akan tampil setelah pesanan dikirim.</li>
        </ol>
        <p className="mt-3">
          Bisa juga pesan langsung via WhatsApp {s.whatsapp} atau lewat marketplace Tokopedia &amp; Shopee.{" "}
          <Link href="/cara-belanja" className="text-ink underline">Selengkapnya</Link>
        </p>
      </Section>

      <Section title="Retur dan Pengembalian Dana">
        <p>
          Produk yang rusak atau tidak sesuai pesanan dapat diretur dengan menghubungi CS kami maksimal 1×24 jam setelah
          barang diterima, disertai foto/video unboxing. Dana dikembalikan ke rekening Anda setelah retur kami verifikasi.{" "}
          <Link href="/syarat-ketentuan" className="text-ink underline">Syarat &amp; Ketentuan</Link>
        </p>
      </Section>

      <Section title={`Alamat Toko ${s.storeName.replace(/^Apoti[ck]\s+/i, "")}`}>
        <ul className="space-y-1.5">
          <li className="flex gap-3"><span aria-hidden className="w-4 text-center text-[#555]">⌖</span>{s.address}</li>
          <li className="flex gap-3"><span aria-hidden className="w-4 text-center text-[#555]">✆</span><span className="text-[#333]">{s.whatsapp}{s.csName && ` (${s.csName})`}</span></li>
          {s.email && (
            <li className="flex gap-3"><span aria-hidden className="w-4 text-center text-[#555]">✉</span><a href={`mailto:${s.email}`} className="text-[#333] hover:underline">{s.email}</a></li>
          )}
        </ul>
      </Section>

      <div id="kontak" className="mt-14 grid gap-10 md:grid-cols-2 md:gap-5">
        <section>
          <h2 className="border-b border-[#777] pb-2 text-xl uppercase text-[#54595f]">Apakah ada pertanyaan mengenai produk kami?</h2>
          <div className="pt-5">
            <ContactForm />
          </div>
        </section>
        <section>
          <h2 className="border-b border-[#777] pb-2 text-xl uppercase text-[#54595f]">Alamat</h2>
          <iframe
            src={mapSrc}
            title="Lokasi apotek"
            className="mt-5 h-[380px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </section>
      </div>
    </div>
  );
}
