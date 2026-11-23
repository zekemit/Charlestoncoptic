import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import nextConfig from "../next.config";

describe("HTTP security headers (next.config.ts)", async () => {
  const rules = await nextConfig.headers!();
  const all = Object.fromEntries(rules.find((r) => r.source === "/:path*")!.headers.map((h) => [h.key, h.value]));
  const csp = Object.fromEntries(
    all["Content-Security-Policy"].split(";").map((d) => {
      const [name, ...vals] = d.trim().split(/\s+/);
      return [name, vals.join(" ")];
    }),
  ) as Record<string, string>;

  it("sets every required header on all routes", () => {
    for (const h of [
      "Content-Security-Policy",
      "Strict-Transport-Security",
      "X-Frame-Options",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
    ]) {
      expect(all[h], h).toBeTruthy();
    }
    expect(all["X-Frame-Options"]).toBe("DENY");
    expect(all["X-Content-Type-Options"]).toBe("nosniff");
    expect(all["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("HSTS lasts at least a year and does not claim subdomains", () => {
    const age = Number(/max-age=(\d+)/.exec(all["Strict-Transport-Security"])![1]);
    expect(age).toBeGreaterThanOrEqual(31536000);
    expect(all["Strict-Transport-Security"]).not.toMatch(/includeSubDomains|preload/i);
  });

  it("CSP blocks framing, plugins, foreign forms and foreign <base>", () => {
    expect(csp["default-src"]).toBe("'self'");
    expect(csp["frame-ancestors"]).toBe("'none'");
    expect(csp["object-src"]).toBe("'none'");
    expect(csp["base-uri"]).toBe("'self'");
    expect(csp["form-action"]).toBe("'self'");
  });

  it("CSP keeps scripts and network calls first-party, with no eval and no wildcard", () => {
    expect(csp["script-src"]).toBe("'self' 'unsafe-inline'");
    expect(csp["script-src"]).not.toContain("unsafe-eval");
    expect(csp["connect-src"]).toBe("'self'");
    for (const v of Object.values(csp)) expect(v).not.toMatch(/(^|\s)\*(\s|$)/);
  });

  it("CSP only frames Google (the map) and loads remote images over https only", () => {
    expect(csp["frame-src"]).toBe("https://www.google.com");
    expect(csp["img-src"]).toContain("https:");
    expect(csp["img-src"]).not.toMatch(/(^|\s)http:/);
    expect(Object.keys(csp)).toContain("upgrade-insecure-requests");
  });

  it("API and admin responses are never cached or indexed", () => {
    const api = rules.find((r) => r.source === "/api/:path*")!.headers.map((h) => `${h.key}: ${h.value}`).join("\n");
    expect(api).toMatch(/no-store/);
    expect(api).toMatch(/noindex/);
    expect(rules.find((r) => r.source === "/admin/:path*")!.headers[0].value).toMatch(/noindex/);
  });

  it("does not publish browser source maps or X-Powered-By, and allows no remote image hosts", () => {
    expect(nextConfig.productionBrowserSourceMaps).toBe(false);
    expect(nextConfig.poweredByHeader).toBe(false);
    expect(nextConfig.images?.remotePatterns).toEqual([]);
    expect(nextConfig.images?.dangerouslyAllowSVG).toBe(false);
  });
});

describe("shared rate limiter", () => {
  const ENV_KEYS = ["KV_REST_API_URL", "KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"];
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  function fakeRedis() {
    const counts = new Map<string, number>();
    const seen: unknown[][] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        expect(url).toBe("https://rl.upstash.io/pipeline");
        expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
        const cmds = JSON.parse(init.body as string) as (string | number)[][];
        seen.push(...cmds);
        const out = cmds.map((c) => {
          if (c[0] === "INCR") {
            counts.set(String(c[1]), (counts.get(String(c[1])) ?? 0) + 1);
            return { result: counts.get(String(c[1])) };
          }
          if (c[0] === "EXPIRE") return { result: 1 };
          if (c[0] === "TTL") return { result: 540 };
          return { error: "unknown" };
        });
        return Response.json(out);
      }),
    );
    return { counts, seen };
  }

  it("counts across instances through Redis and blocks past the limit with a real Retry-After", async () => {
    process.env.KV_REST_API_URL = "https://rl.upstash.io";
    process.env.KV_REST_API_TOKEN = "tok";
    const { counts } = fakeRedis();
    const { checkRateLimit } = await import("@/lib/rate-limit");

    for (let i = 0; i < 3; i++) expect(await checkRateLimit("login:203.0.113.9", 3, 900_000)).toEqual({ ok: true });
    const blocked = await checkRateLimit("login:203.0.113.9", 3, 900_000);
    expect(blocked).toEqual({ ok: false, retryAfterSeconds: 540 });
    expect(counts.size).toBe(1);
  });

  it("stores only a hash of the key, never the raw IP address", async () => {
    process.env.KV_REST_API_URL = "https://rl.upstash.io";
    process.env.KV_REST_API_TOKEN = "tok";
    const { seen } = fakeRedis();
    const { checkRateLimit } = await import("@/lib/rate-limit");
    await checkRateLimit("contact:198.51.100.77", 5, 600_000);
    const keys = seen.map((c) => String(c[1]));
    expect(keys.every((k) => /^rl:[0-9a-f]{32}$/.test(k))).toBe(true);
    expect(keys.join()).not.toContain("198.51.100.77");
    expect(seen.find((c) => c[0] === "EXPIRE")).toEqual(["EXPIRE", keys[0], 600, "NX"]);
  });

  it("different clients get different counters", async () => {
    process.env.KV_REST_API_URL = "https://rl.upstash.io";
    process.env.KV_REST_API_TOKEN = "tok";
    const { counts } = fakeRedis();
    const { checkRateLimit } = await import("@/lib/rate-limit");
    await checkRateLimit("login:1.1.1.1", 1, 60_000);
    await checkRateLimit("login:2.2.2.2", 1, 60_000);
    expect(counts.size).toBe(2);
    expect(await checkRateLimit("login:3.3.3.3", 1, 60_000)).toEqual({ ok: true });
  });

  it("falls back to the in-memory limiter if Redis is down (never fails open, never locks everyone out)", async () => {
    process.env.KV_REST_API_URL = "https://rl.upstash.io";
    process.env.KV_REST_API_TOKEN = "tok";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 500 })));
    const { checkRateLimit, resetRateLimits } = await import("@/lib/rate-limit");
    resetRateLimits();
    expect(await checkRateLimit("login:9.9.9.9", 2, 60_000, 1000)).toEqual({ ok: true });
    expect(await checkRateLimit("login:9.9.9.9", 2, 60_000, 1001)).toEqual({ ok: true });
    const third = await checkRateLimit("login:9.9.9.9", 2, 60_000, 1002);
    expect(third.ok).toBe(false);
  });

  it("uses the in-memory limiter when Redis isn't configured (local development)", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const { checkRateLimit, resetRateLimits } = await import("@/lib/rate-limit");
    resetRateLimits();
    expect(await checkRateLimit("k", 1, 1000, 0)).toEqual({ ok: true });
    expect((await checkRateLimit("k", 1, 1000, 1)).ok).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});
