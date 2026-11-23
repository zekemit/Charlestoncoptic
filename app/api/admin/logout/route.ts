import { endAdminSession } from "@/lib/auth";
import { isSameOrigin, json } from "@/lib/request";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return json({ ok: false, message: "This request was blocked." }, 403);
  await endAdminSession();
  return json({ ok: true });
}
