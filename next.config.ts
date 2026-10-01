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
};

export default nextConfig;
