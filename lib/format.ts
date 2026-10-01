const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(value: number) {
  // Intl menghasilkan "Rp 215.000" (dengan spasi non-breaking); samakan dengan gaya "Rp215.000"
  return rupiah.format(value).replace(/\s/g, "");
}

const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export function formatDateTime(date: Date) {
  return dateTime.format(date);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function discountPercent(price: number, compareAtPrice?: number | null) {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/** Nomor WA "0878-3786-7226" → "6287837867226" untuk link wa.me */
export function toWaNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

export function waLink(phone: string, text: string) {
  return `https://wa.me/${toWaNumber(phone)}?text=${encodeURIComponent(text)}`;
}

/** Hanya izinkan path internal untuk parameter `next` (mencegah open redirect) */
export function safeNextPath(value: unknown): string | undefined {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
    ? value
    : undefined;
}
