import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PopupInput } from "@/lib/popup";

const KEYS = ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_URL", "KV_REST_API_TOKEN", "VERCEL"];
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

const input: PopupInput = {
  enabled: true,
  title: "No liturgy this Saturday",
  body: "Have a blessed week!",
  imageUrl: "",
  imageAlt: "",
  ctaEnabled: false,
  ctaLabel: "",
  ctaUrl: "",
  expiresAt: "2026-11-29T04:59:00.000Z",
  frequency: "session",
};

describe("storage mode", () => {
  it("uses Upstash when either env family is present", async () => {
    const { storageMode, redisConfig } = await import("@/lib/popup-store");
    expect(storageMode({ UPSTASH_REDIS_REST_URL: "https://x.upstash.io", UPSTASH_REDIS_REST_TOKEN: "t" })).toBe("redis");
    expect(storageMode({ KV_REST_API_URL: "https://x.upstash.io/", KV_REST_API_TOKEN: "t" })).toBe("redis");
    expect(redisConfig({ KV_REST_API_URL: "https://x.upstash.io/", KV_REST_API_TOKEN: "t" })).toEqual({
      url: "https://x.upstash.io",
      token: "t",
    });
  });

  it("needs both the URL and the token", async () => {
    const { storageMode } = await import("@/lib/popup-store");
    expect(storageMode({ KV_REST_API_URL: "https://x.upstash.io" })).toBe("file");
  });

  it("refuses to pretend on Vercel without storage (read-only filesystem)", async () => {
    const { storageMode } = await import("@/lib/popup-store");
    expect(storageMode({ VERCEL: "1" })).toBe("unconfigured");
    expect(storageMode({})).toBe("file");
  });
});

describe("Upstash mode", () => {
  beforeEach(() => {
    process.env.KV_REST_API_URL = "https://example.upstash.io";
    process.env.KV_REST_API_TOKEN = "tok";
  });

  it("round-trips through the REST API and bumps the version on every save", async () => {
    let stored: string | null = null;
    const calls: unknown[][] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const cmd = JSON.parse(init.body as string) as string[];
        calls.push(cmd);
        expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
        if (cmd[0] === "GET") return Response.json({ result: stored });
        stored = cmd[2];
        return Response.json({ result: "OK" });
      }),
    );
    const { getPopup, savePopup } = await import("@/lib/popup-store");

    expect((await getPopup()).enabled).toBe(false); // nothing stored yet: seed (disabled)
    const first = await savePopup(input);
    expect(first.version).toBe(1);
    const second = await savePopup({ ...input, title: "Updated" });
    expect(second.version).toBe(2);
    const read = await getPopup();
    expect(read).toMatchObject({ title: "Updated", version: 2, enabled: true });
    expect(read.updatedAt).toMatch(/^\d{4}-/);
    expect(calls.filter((c) => c[0] === "SET")).toHaveLength(2);
  });

  it("public reads fail safe: a storage outage yields no popup instead of an error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));
    const { getPopup } = await import("@/lib/popup-store");
    expect((await getPopup()).enabled).toBe(false);
  });

  it("admin reads (strict) surface the error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ error: "WRONGPASS" }, { status: 401 })));
    const { getPopup } = await import("@/lib/popup-store");
    await expect(getPopup({ strict: true })).rejects.toThrow(/WRONGPASS/);
  });

  it("a failed save throws rather than silently losing the change", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_u: string, init: RequestInit) =>
        JSON.parse(init.body as string)[0] === "GET"
          ? Response.json({ result: null })
          : Response.json({ error: "ERR" }, { status: 500 }),
      ),
    );
    const { savePopup } = await import("@/lib/popup-store");
    await expect(savePopup(input)).rejects.toThrow(/Upstash SET failed/);
  });
});

describe("unconfigured on Vercel", () => {
  it("reads the disabled default and refuses to save", async () => {
    process.env.VERCEL = "1";
    const { getPopup, savePopup, StorageNotConfiguredError } = await import("@/lib/popup-store");
    expect((await getPopup()).enabled).toBe(false);
    await expect(savePopup(input)).rejects.toBeInstanceOf(StorageNotConfiguredError);
  });
});

describe("local file mode", () => {
  it("saves to data/popup.json and reads it back", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "popup-test-"));
    const cwd = process.cwd();
    process.chdir(dir);
    try {
      vi.resetModules();
      const { getPopup, savePopup } = await import("@/lib/popup-store");
      const saved1 = await savePopup(input);
      expect(saved1.version).toBe(1);
      const onDisk = JSON.parse(await fs.readFile(path.join(dir, "data", "popup.json"), "utf8"));
      expect(onDisk).toMatchObject({ title: "No liturgy this Saturday", enabled: true, version: 1 });
      expect(await getPopup()).toMatchObject({ title: "No liturgy this Saturday", version: 1 });
    } finally {
      process.chdir(cwd);
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
