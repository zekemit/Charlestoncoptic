// Small in-memory sliding-window limiter. On serverless hosting each warm instance keeps its
// own counters, so this is a best-effort brake against bursts (a stuck form, a lazy bot), not
// a hard global quota. Hard abuse protection belongs in Vercel Firewall rules.

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
