import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Todas as imagens vêm do proxy de otimização da própria API (`/img`).
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
  },
};

export default nextConfig;
