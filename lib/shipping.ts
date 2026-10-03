export const PROVINCES = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Kepulauan Riau",
  "Jambi",
  "Bengkulu",
  "Sumatera Selatan",
  "Kepulauan Bangka Belitung",
  "Lampung",
  "Banten",
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Gorontalo",
  "Sulawesi Tengah",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Maluku",
  "Maluku Utara",
  "Papua",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua Tengah",
  "Papua Pegunungan",
  "Papua Selatan",
];

/** Kota/kabupaten untuk provinsi yang memuat wilayah Jabodetabek (dipilih dari daftar agar zona ongkir akurat) */
export const CITIES_BY_PROVINCE: Record<string, string[]> = {
  "DKI Jakarta": [
    "Kota Jakarta Pusat",
    "Kota Jakarta Utara",
    "Kota Jakarta Barat",
    "Kota Jakarta Selatan",
    "Kota Jakarta Timur",
    "Kabupaten Kepulauan Seribu",
  ],
  "Jawa Barat": [
    "Kota Bogor",
    "Kabupaten Bogor",
    "Kota Depok",
    "Kota Bekasi",
    "Kabupaten Bekasi",
    "Kota Bandung",
    "Kabupaten Bandung",
    "Kabupaten Bandung Barat",
    "Kota Banjar",
    "Kabupaten Ciamis",
    "Kabupaten Cianjur",
    "Kota Cimahi",
    "Kota Cirebon",
    "Kabupaten Cirebon",
    "Kabupaten Garut",
    "Kabupaten Indramayu",
    "Kabupaten Karawang",
    "Kabupaten Kuningan",
    "Kabupaten Majalengka",
    "Kabupaten Pangandaran",
    "Kabupaten Purwakarta",
    "Kabupaten Subang",
    "Kota Sukabumi",
    "Kabupaten Sukabumi",
    "Kabupaten Sumedang",
    "Kota Tasikmalaya",
    "Kabupaten Tasikmalaya",
  ],
  Banten: [
    "Kota Tangerang",
    "Kabupaten Tangerang",
    "Kota Tangerang Selatan",
    "Kota Cilegon",
    "Kota Serang",
    "Kabupaten Serang",
    "Kabupaten Lebak",
    "Kabupaten Pandeglang",
  ],
};

/** Nama "wilayah" khusus di tabel tarif ongkir untuk zona Jabodetabek */
export const JABODETABEK = "Jabodetabek";

/** Jakarta, Bogor, Depok, Tangerang (termasuk Tangerang Selatan), Bekasi */
export function isJabodetabek(province: string, city: string) {
  if (province === "DKI Jakarta") return true;
  if (province !== "Jawa Barat" && province !== "Banten") return false;
  return /bogor|depok|tangerang|bekasi/i.test(city);
}

export type ShippingConfig = {
  rates: { region: string; cost: number }[];
  flatShippingCost: number;
  freeShippingMin: number;
};

/**
 * Ongkir: tarif Jabodetabek bila alamat di Jabodetabek dan tarifnya diatur, lalu tarif per provinsi,
 * selain itu tarif flat; gratis di atas minimum belanja.
 */
export function calculateShipping(province: string, city: string, subtotal: number, config: ShippingConfig) {
  if (config.freeShippingMin > 0 && subtotal >= config.freeShippingMin) return 0;
  const rateOf = (region: string) => config.rates.find((r) => r.region.toLowerCase() === region.toLowerCase());
  const rate = (isJabodetabek(province, city) && rateOf(JABODETABEK)) || rateOf(province);
  return rate ? rate.cost : config.flatShippingCost;
}
