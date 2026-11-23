import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import seed from "@/data/popup.json";
import { type PopupConfig, type PopupInput, normalizePopup } from "@/lib/popup";

// Where the live popup settings are stored:
//  1. Upstash Redis (Vercel Marketplace) when its REST env vars exist. Required in production on Vercel.
//  2. data/popup.json on local disk, for development only. Vercel's runtime filesystem is read-only.

const KEY = "smsg:popup:v1";
const FILE = path.join(process.cwd(), "data", "popup.json");

type Env = Record<string, string | undefined>;
export type StorageMode = "redis" | "file" | "unconfigured";

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("No popup storage is configured. Connect Upstash Redis in Vercel (see README).");
    this.name = "StorageNotConfiguredError";
  }
}

export function redisConfig(env: Env = process.env): { url: string; token: string } | null {
  const url = (env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL)?.trim();
  const token = (env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN)?.trim();
  return url && token ? { url: url.replace(/\/$/, ""), token } : null;
}

export function storageMode(env: Env = process.env): StorageMode {
  if (redisConfig(env)) return "redis";
  return env.VERCEL ? "unconfigured" : "file";
}

async function redis(cmd: (string | number)[]): Promise<unknown> {
  const cfg = redisConfig()!;
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const data = (await res.json().catch(() => null)) as { result?: unknown; error?: string } | null;
  if (!res.ok || !data || data.error) {
    throw new Error(`Upstash ${cmd[0]} failed: ${data?.error ?? res.status}`);
  }
  return data.result;
}

async function read(mode: StorageMode): Promise<PopupConfig> {
  if (mode === "redis") {
    const raw = await redis(["GET", KEY]);
    return typeof raw === "string" ? normalizePopup(JSON.parse(raw)) : normalizePopup(seed);
  }
  if (mode === "file") {
    try {
      return normalizePopup(JSON.parse(await fs.readFile(FILE, "utf8")));
    } catch {
      return normalizePopup(seed);
    }
  }
  return normalizePopup(seed);
}

/**
 * Current popup settings. By default a storage failure returns the (disabled) default so a
 * database hiccup can never break the homepage. The admin screen passes `strict` to see errors.
 */
export async function getPopup(options: { strict?: boolean } = {}): Promise<PopupConfig> {
  try {
    return await read(storageMode());
  } catch (err) {
    if (options.strict) throw err;
    console.error("[popup] read failed:", err instanceof Error ? err.message : err);
    return normalizePopup(seed);
  }
}

export async function savePopup(input: PopupInput): Promise<PopupConfig> {
  const mode = storageMode();
  if (mode === "unconfigured") throw new StorageNotConfiguredError();

  const previous = await read(mode);
  const next: PopupConfig = {
    ...input,
    version: previous.version + 1,
    updatedAt: new Date().toISOString(),
  };

  if (mode === "redis") {
    await redis(["SET", KEY, JSON.stringify(next)]);
  } else {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(next, null, 2) + "\n");
  }
  return next;
}
