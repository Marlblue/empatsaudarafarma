import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";
import { RichText } from "@/components/rich-text";

// Halaman informasi statis. Teks dapat disesuaikan dengan kebijakan apotek.
const PAGES: Record<string, { title: string; body: (store: string, wa: string) => string }> = {
  "cara-belanja": {
    title: "Cara Belanja",
    body: (store, wa) => `Berikut langkah berbelanja di ${store}:

- Cari produk melalui kolom pencarian atau menu kategori.
- Klik "Tambah ke Keranjang" lalu buka keranjang belanja.
- Klik "Checkout", masuk atau daftar akun, lalu isi alamat pengiriman.
- Pilih metode pembayaran: Transfer Bank atau COD.
- Untuk transfer, lakukan pembayaran lalu unggah bukti transfer di halaman pesanan.
- Pesanan diproses setelah pembayaran terverifikasi dan nomor resi akan tampil di halaman pesanan.

Anda juga bisa memesan langsung melalui WhatsApp ${wa} dengan tombol "Pesan via WhatsApp" di setiap produk.

Untuk obat keras yang memerlukan resep dokter, admin akan meminta foto resep sebelum pesanan diproses.`,
  },
  "kebijakan-privasi": {
    title: "Kebijakan Privasi",
    body: (store) => `${store} menghargai privasi Anda. Data yang kami kumpulkan (nama, email, nomor telepon, dan alamat) hanya digunakan untuk memproses pesanan, pengiriman, dan komunikasi terkait layanan.

Kami tidak menjual atau membagikan data pribadi Anda kepada pihak lain, kecuali kepada mitra pengiriman untuk keperluan pengantaran pesanan.

Password akun disimpan dalam bentuk terenkripsi. Anda dapat menghubungi kami untuk meminta penghapusan akun dan data pribadi.`,
  },
  "syarat-ketentuan": {
    title: "Syarat & Ketentuan",
    body: (store) => `Dengan berbelanja di ${store}, Anda menyetujui ketentuan berikut:

- Harga dan ketersediaan produk dapat berubah sewaktu-waktu.
- Pesanan dengan metode transfer akan dibatalkan otomatis bila tidak dibayar melewati batas waktu pembayaran.
- Obat keras hanya dapat dibeli dengan resep dokter yang sah.
- Produk yang sudah diterima tidak dapat dikembalikan kecuali terdapat kerusakan atau kesalahan pengiriman yang dilaporkan maksimal 1×24 jam setelah diterima.`,
  },
};

export async function generateMetadata({ params }: PageProps<"/[info]">): Promise<Metadata> {
  const { info } = await params;
  const page = PAGES[info];
  return page ? { title: page.title, alternates: { canonical: `/${info}` } } : {};
}

export default async function InfoPage({ params }: PageProps<"/[info]">) {
  const page = PAGES[(await params).info];
  if (!page) notFound();
  const s = await getSettings();
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="mb-6 text-3xl font-bold text-brand-900">{page.title}</h1>
      <RichText text={page.body(s.storeName, s.whatsapp)} className="text-base" />
    </div>
  );
}
