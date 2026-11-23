import { startAdminSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, isSameOrigin, json, readJson } from "@/lib/request";
import { isAdminConfigured, verifyPassword } from "@/lib/session-token";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ ok: false, message: "This request was blocked." }, 403);

  if (!isAdminConfigured()) {
    return json(
      { ok: false, message: "Admin sign-in isn't set up yet. Add an ADMIN_PASSWORD in the hosting settings." },
      503,
    );
  }

  const limit = rateLimit(`login:${clientIp(request)}`, 10, 15 * 60 * 1000);
  if (!limit.ok) {
    return json({ ok: false, message: "Too many sign-in attempts. Please wait a few minutes and try again." }, 429, {
      "Retry-After": String(limit.retryAfterSeconds),
    });
  }

  const body = (await readJson(request, 2000)) as { password?: unknown } | undefined;
  const password = typeof body?.password === "string" ? body.password : "";

  if (!password || !verifyPassword(password)) {
    // A short pause makes password guessing slower without bothering the real admin.
    await new Promise((r) => setTimeout(r, 600));
    return json({ ok: false, message: "That password isn't right." }, 401);
  }

  await startAdminSession();
  return json({ ok: true });
}
