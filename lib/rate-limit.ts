import { createHash } from "node:crypto";
import { redisConfig, redisPipeline } from "@/lib/redis";

// Two layers:
//  - checkRateLimit(): shared across every serverless instance via Upstash Redis (fixed window).
//    This is what the login and contact endpoints use. Without it, each warm instance would keep
//    its own counters, so an attacker could multiply their allowance by hitting different instances.
//  - rateLimit(): per-instance sliding window in memory. Used for local development and as the
//    fallback if Redis is unreachable (so an outage never locks the admin out or opens the floodgates).

const hits = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
  }
  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 2000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  return { ok: true };
}

export function resetRateLimits(): void {
  hits.clear();
}

export type RateResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/**
 * Counts this request against `key` for the current window and says whether it is allowed.
 * Keys are hashed before they reach Redis so raw IP addresses are never stored there.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): Promise<RateResult> {
  if (redisConfig()) {
    try {
      const redisKey = `rl:${createHash("sha256").update(key).digest("hex").slice(0, 32)}`;
      const windowSec = Math.ceil(windowMs / 1000);
      // INCR, then make sure the key expires (NX: only if it has no expiry yet), then read the TTL.
      const [count, , ttl] = await redisPipeline([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, windowSec, "NX"],
        ["TTL", redisKey],
      ]);
      if (Number(count) > limit) {
        const wait = Number(ttl);
        return { ok: false, retryAfterSeconds: wait > 0 ? wait : windowSec };
      }
      return { ok: true };
    } catch (err) {
      console.error("[rate-limit] Redis unavailable, using in-memory limiter:", err instanceof Error ? err.message : err);
    }
  }
  return rateLimit(key, limit, windowMs, now);
}
