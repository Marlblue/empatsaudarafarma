import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build mandiri (server.js + node_modules minimal) untuk dijalankan di cPanel "Setup Node.js App"
  output: "standalone",
  // Tanpa sharp: binary native-nya berbeda per OS dan berat untuk shared hosting
  images: { unoptimized: true },
  experimental: {
    serverActions: {
      // Upload gambar produk & bukti transfer lewat Server Actions
      bodySizeLimit: "20mb",
    },
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Cegah halaman (terutama admin) disematkan di situs lain untuk clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
