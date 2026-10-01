import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-brand-200">404</p>
      <h1 className="text-2xl font-bold text-brand-900">Halaman tidak ditemukan</h1>
      <p className="text-gray-600">Halaman atau produk yang Anda cari tidak tersedia.</p>
      <div className="flex gap-3">
        <Link href="/" className="btn-primary">Ke Beranda</Link>
        <Link href="/shop" className="btn-outline">Lihat Produk</Link>
      </div>
    </div>
  );
}
