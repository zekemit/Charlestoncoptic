import "server-only";

// Minimal Upstash Redis REST client (one fetch per call, no dependency).
// Accepts either env naming family: Vercel's Upstash integration adds KV_REST_API_*.

type Env = Record<string, string | undefined>;

export function redisConfig(env: Env = process.env): { url: string; token: string } | null {
  const url = (env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL)?.trim();
  const token = (env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN)?.trim();
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

type Command = (string | number)[];

async function post(path: string, body: unknown): Promise<unknown> {
  const cfg = redisConfig();
  if (!cfg) throw new Error("Redis is not configured");
  const res = await fetch(`${cfg.url}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const data = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error ?? res.status;
    throw new Error(`Upstash request failed: ${msg}`);
  }
  return data;
}

export async function redisCommand(cmd: Command): Promise<unknown> {
  const data = (await post("", cmd)) as { result?: unknown; error?: string } | null;
  if (!data || data.error) throw new Error(`Upstash ${cmd[0]} failed: ${data?.error ?? "no response"}`);
  return data.result;
}

/** Runs several commands in one round trip. Returns each command's result, in order. */
export async function redisPipeline(cmds: Command[]): Promise<unknown[]> {
  const data = (await post("/pipeline", cmds)) as { result?: unknown; error?: string }[] | null;
  if (!Array.isArray(data) || data.length !== cmds.length) throw new Error("Upstash pipeline returned an unexpected response");
  return data.map((entry, i) => {
    if (entry.error) throw new Error(`Upstash ${cmds[i][0]} failed: ${entry.error}`);
    return entry.result;
  });
}
