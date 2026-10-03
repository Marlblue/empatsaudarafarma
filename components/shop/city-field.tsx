"use client";

import { CITIES_BY_PROVINCE } from "@/lib/shipping";

/**
 * Kolom kota/kabupaten: daftar pilihan untuk provinsi di sekitar Jabodetabek (agar zona ongkir akurat),
 * isian bebas untuk provinsi lain.
 */
export function CityField({ province, value, onChange }: { province: string; value: string; onChange: (city: string) => void }) {
  const options = CITIES_BY_PROVINCE[province];
  if (!options) {
    return <input name="city" value={value} onChange={(e) => onChange(e.target.value)} required className="input" />;
  }
  // Alamat lama yang diketik bebas tetap bisa dipilih
  const list = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <select name="city" value={value} onChange={(e) => onChange(e.target.value)} required className="input">
      <option value="">Pilih kota / kabupaten</option>
      {list.map((c) => (
        <option key={c}>{c}</option>
      ))}
    </select>
  );
}
