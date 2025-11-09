import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Optimize heavy packages - Next.js 16 automatic tree-shaking
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "motion",
      "gsap",
      "ogl",
    ],
  },
};

export default nextConfig;
