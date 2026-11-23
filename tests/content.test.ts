import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GALLERY_ALTS, albums } from "@/lib/images";
import { resetRateLimits, rateLimit } from "@/lib/rate-limit";
import { clientIp, isSameOrigin, readJson } from "@/lib/request";
import { CHURCH_ADDRESS, SERVICE_ADDRESS, SITE, directionsUrl, mapEmbedUrl, oneLine } from "@/lib/site";

describe("gallery content (zero photo loss from the old site)", () => {
  it("has the three albums with 11, 29 and 12 photos", () => {
    expect(albums.map((a) => a.photos.length)).toEqual([11, 29, 12]);
    expect(albums.reduce((n, a) => n + a.photos.length, 0)).toBe(52);
  });

  it("has an individual alt text for every photo", () => {
    for (const a of albums) {
      expect(GALLERY_ALTS[a.slug]).toHaveLength(a.photos.length);
      for (const p of a.photos) expect(p.alt.length).toBeGreaterThan(10);
    }
  });

  it("every photo file exists with real dimensions", () => {
    for (const a of albums) {
      for (const p of a.photos) {
        expect(fs.existsSync(path.join(process.cwd(), "public", p.src))).toBe(true);
        expect(p.width).toBeGreaterThan(100);
        expect(p.height).toBeGreaterThan(100);
      }
    }
  });

  it("keeps the original album titles and dates", () => {
    expect(albums[0]).toMatchObject({ title: "Cleaning the new church building", dateLabel: "June 26, 2025" });
    expect(albums[2]).toMatchObject({ title: "Feast of the Holy Nativity", dateLabel: "January 6, 2021" });
  });
});

describe("church facts", () => {
  it("matches the old site's addresses and contact details", () => {
    expect(oneLine(SERVICE_ADDRESS)).toBe("3921 St Johns Ave, Charleston, SC 29405");
    expect(oneLine(CHURCH_ADDRESS)).toBe("2929 Bennett Charles Rd, Mt Pleasant, SC 29466");
    expect(SITE.email).toBe("charlestoncopts@gmail.com");
    expect(SITE.zellePhone).toBe("843-437-1255");
    expect(SITE.venmo).toBe("https://venmo.com/StMaryandStGeorge-CHSCopticChu");
  });

  it("builds map links from the address", () => {
    expect(directionsUrl(SERVICE_ADDRESS)).toContain("destination=3921%20St%20Johns%20Ave");
    expect(mapEmbedUrl(SERVICE_ADDRESS)).toContain("output=embed");
  });
});

describe("rate limiter", () => {
  it("allows up to the limit, then blocks until the window passes", () => {
    resetRateLimits();
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 60_000, t0 + i)).toEqual({ ok: true });
    const blocked = rateLimit("k", 3, 60_000, t0 + 10);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(rateLimit("k", 3, 60_000, t0 + 61_000)).toEqual({ ok: true });
  });

  it("tracks keys independently", () => {
    resetRateLimits();
    expect(rateLimit("a", 1, 1000, 0).ok).toBe(true);
    expect(rateLimit("a", 1, 1000, 1).ok).toBe(false);
    expect(rateLimit("b", 1, 1000, 1).ok).toBe(true);
  });
});

describe("request helpers", () => {
  const req = (headers: Record<string, string>) => new Request("https://www.charlestoncoptic.org/api/x", { headers });

  it("reads the first forwarded IP", () => {
    expect(clientIp(req({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" }))).toBe("203.0.113.9");
    expect(clientIp(req({ "x-real-ip": "198.51.100.7" }))).toBe("198.51.100.7");
    expect(clientIp(req({}))).toBe("unknown");
  });

  it("blocks cross-site browser requests but allows same-origin and header-less clients", () => {
    expect(isSameOrigin(req({ host: "www.charlestoncoptic.org", origin: "https://www.charlestoncoptic.org" }))).toBe(true);
    expect(isSameOrigin(req({ host: "www.charlestoncoptic.org", origin: "https://evil.example" }))).toBe(false);
    expect(isSameOrigin(req({ host: "www.charlestoncoptic.org", origin: "not a url" }))).toBe(false);
    expect(isSameOrigin(req({ host: "www.charlestoncoptic.org" }))).toBe(true);
  });

  it("caps request body size and rejects bad JSON", async () => {
    const post = (body: string, extra: Record<string, string> = {}) =>
      new Request("https://x.test/api", { method: "POST", body, headers: extra });
    expect(await readJson(post('{"a":1}'))).toEqual({ a: 1 });
    expect(await readJson(post("{nope"))).toBeUndefined();
    expect(await readJson(post("x".repeat(100)), 50)).toBeUndefined();
    expect(await readJson(post("{}", { "content-length": "999999" }), 1000)).toBeUndefined();
  });
});
