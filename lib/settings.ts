import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

export type BankAccount = { bank: string; number: string; holder: string };
export type Highlight = { title: string; text: string };

export type StoreSettings = {
  storeName: string;
  tagline: string;
  logoUrl: string;
  whatsapp: string;
  /** Nama CS pemegang nomor WhatsApp */
  csName: string;
  email: string;
  address: string;
  hours: string;
  mapEmbedUrl: string;
  banks: BankAccount[];
  tokopediaUrl: string;
  shopeeUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  licenseInfo: string;
  features: Highlight[];
  services: Highlight[];
  aboutContent: string;
  flatShippingCost: number;
  freeShippingMin: number;
  codEnabled: boolean;
  paymentDueHours: number;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Empat Saudara Farma",
  tagline: "Apotek Online",
  logoUrl: "/images/site/logo.png",
  whatsapp: "0821-6914-9725",
  csName: "Roy",
  email: "",
  address:
    "Pasar Pramuka, RT.12/RW.1, Palmeriam, Kec. Matraman, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13140",
  hours: "Senin – Sabtu 09.30 – 17.00 WIB (Minggu tutup)",
  mapEmbedUrl: "",
  // Ubah rekening lewat Admin → Pengaturan Toko
  banks: [{ bank: "BCA", number: "0613128767", holder: "Roynal" }],
  tokopediaUrl: "https://www.tokopedia.com/",
  shopeeUrl: "https://shopee.co.id/",
  instagramUrl: "",
  facebookUrl: "",
  twitterUrl: "",
  licenseInfo: "No. Izin Apotek: - · SIPA Apoteker: -",
  features: [
    { title: "Gratis Ongkir dan COD (Bayar Di Tempat)", text: "Transaksi Via Marketplace" },
  ],
  services: [
    { title: "Customer Service", text: "CS. Roy 0821-6914-9725" },
    { title: "Produk Berkualitas", text: "Jaminan kualitas produk terbaik untuk Anda" },
    { title: "Pengiriman Cepat", text: "Kurir terbaik untuk pengiriman cepat" },
  ],
  aboutContent:
    "Empat Saudara Farma adalah apotek online yang menjamin kualitas produk dan pelayanan pengiriman yang cepat.\n\nKami menyediakan alat cek gula darah, cairan infus, injeksi, inhaler, insulin, nebulizer, perawatan luka, multivitamin, pampers dewasa, obat generik, salep, hingga sirup.",
  flatShippingCost: 15000,
  freeShippingMin: 0,
  codEnabled: true,
  paymentDueHours: 24,
};

const SETTINGS_KEY = "store";

export const getSettings = cache(async (): Promise<StoreSettings> => {
  const row = await db.setting.findUnique({ where: { key: SETTINGS_KEY } });
  return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<StoreSettings>) ?? {}) };
});

export async function saveSettings(patch: Partial<StoreSettings>) {
  const current = await getSettings();
  const value = { ...current, ...patch };
  await db.setting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value },
    update: { value },
  });
}
