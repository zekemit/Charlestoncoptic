import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content-Security-Policy without nonces (see node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
// A nonce-based policy would force every page to render dynamically; this site has no user-generated
// HTML (all text is React-escaped; the popup's mini-markup is parsed into elements, never injected),
// so we keep static pages and accept 'unsafe-inline' for the framework's own bootstrap scripts.
// Everything else is locked down: no plugins, no framing, no foreign forms, same-origin fetches only.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // https: is needed because the admin may point the popup at a flyer hosted anywhere.
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  // The Visit Us page embeds a Google map.
  "frame-src https://www.google.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Two years. No includeSubDomains/preload on purpose: the domain's other subdomains (mail, etc.)
  // are managed elsewhere and this site must not be able to force HTTPS-only on them.
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Never ship readable client source to visitors.
  productionBrowserSourceMaps: false,
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
    // Only local images are optimized. An explicit empty list means the image optimizer can never be
    // used to fetch (or proxy) a remote URL.
    remotePatterns: [],
    dangerouslyAllowSVG: false,
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
