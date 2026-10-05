import { toWaNumber } from "@/lib/format";
import type { StoreSettings } from "@/lib/settings";
import { PROVINCES } from "@/lib/shipping";

/** Kota/kabupaten dari alamat toko, mis. "Kota Jakarta Timur" → "Jakarta Timur" */
export function storeArea(address: string) {
  return address.match(/\b(?:Kota|Kabupaten|Kab\.)\s+([^,]+)/i)?.[1]?.trim() ?? "";
}

/** "Apotek Empat Saudara Farma" — hindari "Apotek Apotek ..." bila nama toko sudah diawali "Apotek" */
export function pharmacyName(storeName: string) {
  return /^apote?k\b/i.test(storeName) ? storeName : `Apotek ${storeName}`;
}

const DAYS: Record<string, string> = {
  senin: "Monday",
  selasa: "Tuesday",
  rabu: "Wednesday",
  kamis: "Thursday",
  jumat: "Friday",
  "jum'at": "Friday",
  sabtu: "Saturday",
  minggu: "Sunday",
};
const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** "Senin – Sabtu 09.30 – 17.00 WIB" → jam buka schema.org; null bila formatnya tidak dikenali */
export function parseOpeningHours(hours: string) {
  const m = hours.match(
    /(senin|selasa|rabu|kamis|jum'?at|sabtu|minggu)\s*[–-]\s*(senin|selasa|rabu|kamis|jum'?at|sabtu|minggu)\s+(\d{1,2})[.:](\d{2})\s*[–-]\s*(\d{1,2})[.:](\d{2})/i,
  );
  if (!m) return null;
  const from = WEEK.indexOf(DAYS[m[1].toLowerCase()]);
  const to = WEEK.indexOf(DAYS[m[2].toLowerCase()]);
  if (from < 0 || to < from) return null;
  const time = (h: string, min: string) => `${h.padStart(2, "0")}:${min}`;
  return {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: WEEK.slice(from, to + 1),
    opens: time(m[3], m[4]),
    closes: time(m[5], m[6]),
  };
}

/** Link profil toko yang spesifik (bukan sekadar halaman depan marketplace) */
function profileLinks(s: StoreSettings) {
  return [s.tokopediaUrl, s.shopeeUrl, s.instagramUrl, s.facebookUrl, s.twitterUrl].filter((url) => {
    try {
      return new URL(url).pathname.replace(/\/+$/, "") !== "";
    } catch {
      return false;
    }
  });
}

/** Data terstruktur schema.org/Pharmacy agar Google mengenali toko (nama, alamat, telepon, jam buka) */
export function pharmacyJsonLd(s: StoreSettings, siteUrl: string) {
  const area = storeArea(s.address);
  const postalCode = s.address.match(/\b\d{5}\b/)?.[0];
  // "Daerah Khusus Ibukota Jakarta" pada alamat Google Maps = DKI Jakarta
  const region =
    PROVINCES.find((p) => s.address.toLowerCase().includes(p.toLowerCase())) ??
    (/jakarta/i.test(s.address) ? "DKI Jakarta" : undefined);
  const street = s.address.split(/,\s*(?:Kota|Kabupaten|Kab\.)\s/i)[0].trim();
  const openingHours = parseOpeningHours(s.hours);
  const sameAs = profileLinks(s);
  return {
    "@context": "https://schema.org",
    "@type": "Pharmacy",
    "@id": `${siteUrl}/#apotek`,
    name: pharmacyName(s.storeName),
    alternateName: s.storeName,
    url: siteUrl,
    logo: new URL(s.logoUrl, siteUrl).toString(),
    image: new URL(s.logoUrl, siteUrl).toString(),
    description: `${pharmacyName(s.storeName)}${area ? ` di ${area}` : ""}: ${s.tagline}.`,
    telephone: `+${toWaNumber(s.whatsapp)}`,
    ...(s.email && { email: s.email }),
    address: {
      "@type": "PostalAddress",
      streetAddress: street,
      ...(area && { addressLocality: area }),
      ...(region && { addressRegion: region }),
      ...(postalCode && { postalCode }),
      addressCountry: "ID",
    },
    ...(openingHours && { openingHoursSpecification: [openingHours] }),
    ...(sameAs.length > 0 && { sameAs }),
  };
}
