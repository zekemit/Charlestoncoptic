import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Fixed dates (not "now"): sitemap entries should only change when the page content does.
const PAGES: { path: string; lastModified: string; priority: number }[] = [
  { path: "", lastModified: "2026-11-23", priority: 1 },
  { path: "/visit-us", lastModified: "2026-11-23", priority: 0.9 },
  { path: "/about-us", lastModified: "2026-11-23", priority: 0.8 },
  { path: "/donate", lastModified: "2026-11-23", priority: 0.8 },
  { path: "/gallery", lastModified: "2026-11-23", priority: 0.6 },
  { path: "/contact", lastModified: "2026-11-23", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((p) => ({
    url: `${SITE.url}${p.path}`,
    lastModified: new Date(p.lastModified),
    priority: p.priority,
  }));
}
