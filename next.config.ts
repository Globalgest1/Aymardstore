import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Image Optimization — Enable next/image for external sources */
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: '**.shopify.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.unsplash.com' },
      { protocol: 'https', hostname: '**.stockx-360.imgix.net' },
      { protocol: 'https', hostname: '**.stockx.imgix.net' },
      { protocol: 'https', hostname: 'stockx-360.imgix.net' },
      { protocol: 'https', hostname: 'stockx.imgix.net' },
      { protocol: 'https', hostname: '**.imgix.net' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
    ],
  },

  /* Performance */
  compress: true,
  poweredByHeader: false,

  /* Security Headers */
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
      ],
    },
  ],

  /* Dev Origins */
  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "192.168.1.140:3000",
    "192.168.1.140",
    "10.38.222.119:3000",
    "10.38.222.119"
  ],
};

export default nextConfig;
