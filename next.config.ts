import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // The previous Wix site's URLs. Real pages keep their address; the template-filler
  // pages (events, sermons, ministries) and the broken donate-online page are redirected.
  async redirects() {
    return [
      { source: "/general-5", destination: "/holy-week-2026", permanent: true },
      { source: "/donate-online", destination: "/donate", permanent: true },
      { source: "/events", destination: "/", permanent: true },
      { source: "/events-page", destination: "/", permanent: true },
      { source: "/events-1/:slug*", destination: "/", permanent: true },
      { source: "/sermons", destination: "/", permanent: true },
      { source: "/ministries", destination: "/about-us", permanent: true },
      { source: "/about", destination: "/about-us", permanent: true },
      { source: "/visit", destination: "/visit-us", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
