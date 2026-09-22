import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ne jamais faire échouer un build à cause d'ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
