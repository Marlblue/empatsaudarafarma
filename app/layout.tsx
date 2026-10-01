import type { Metadata } from "next";
import { Average, Lato } from "next/font/google";
import { getSettings } from "@/lib/settings";
import "./globals.css";

const lato = Lato({ variable: "--font-lato", subsets: ["latin"], weight: ["400", "700"] });
const average = Average({ variable: "--font-average", subsets: ["latin"], weight: "400" });

// Semua halaman membaca database, jadi dirender per request
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
    title: { default: `${s.storeName} - ${s.tagline}`, template: `%s - ${s.storeName}` },
    description: `${s.storeName}: ${s.tagline}. Jual injeksi, insulin, infus, alat kesehatan, multivitamin dan obat dengan pengiriman cepat & bisa COD.`,
    icons: { icon: "/images/site/favicon.png" },
    openGraph: { siteName: s.storeName, locale: "id_ID", type: "website" },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${lato.variable} ${average.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
