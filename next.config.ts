import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Upload gambar produk & bukti transfer lewat Server Actions
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
