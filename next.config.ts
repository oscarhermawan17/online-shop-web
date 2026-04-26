import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Disable Next.js image optimization pipeline.
    // MinIO images are served directly from the storage server, and Cloudinary
    // images are already optimized at source. Routing them through /_next/image
    // adds an extra hop with no benefit, and causes "url not allowed" errors
    // for http:// MinIO URLs (localhost and VPS IP) regardless of remotePatterns.
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // ─── MinIO (local dev) ──────────────────────────────────────────────────
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      // ─── MinIO (stg VPS) ────────────────────────────────────────────────────
      {
        protocol: 'http',
        hostname: '43.129.52.166',
        port: '9000',
        pathname: '/**',
      },
      // ─── Cloudinary (kept for existing prod images) ─────────────────────────
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
