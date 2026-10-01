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

export type ShippingConfig = {
  rates: { region: string; cost: number }[];
  flatShippingCost: number;
  freeShippingMin: number;
};

/** Ongkir: tarif per provinsi bila diatur, selain itu tarif flat; gratis di atas minimum belanja. */
export function calculateShipping(province: string, subtotal: number, config: ShippingConfig) {
  if (config.freeShippingMin > 0 && subtotal >= config.freeShippingMin) return 0;
  const rate = config.rates.find((r) => r.region.toLowerCase() === province.toLowerCase());
  return rate ? rate.cost : config.flatShippingCost;
}
