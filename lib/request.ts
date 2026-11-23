/** Client IP as set by the hosting proxy (Vercel sets x-forwarded-for). */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Browsers always send Origin on cross-site POST/PUT. If it is present it must match the
 * host being served; requests without it (curl, server-to-server) are allowed through
 * because they carry no ambient browser credentials.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { ...NO_STORE, ...extra } });
}

/** Reads a JSON body with a hard size cap. Returns undefined when invalid or too large. */
export async function readJson(request: Request, maxBytes = 32_000): Promise<unknown | undefined> {
  const declared = Number(request.headers.get("content-length"));
  if (declared && declared > maxBytes) return undefined;
  try {
    const text = await request.text();
    if (text.length > maxBytes) return undefined;
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
