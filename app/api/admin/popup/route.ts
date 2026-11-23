import { isAdmin } from "@/lib/auth";
import { popupSchema, popupStatus } from "@/lib/popup";
import { StorageNotConfiguredError, getPopup, savePopup, storageMode } from "@/lib/popup-store";
import { isSameOrigin, json, readJson } from "@/lib/request";
import { fieldErrors } from "@/lib/zod-errors";

export async function GET() {
  if (!(await isAdmin())) return json({ message: "Please sign in." }, 401);
  try {
    const config = await getPopup({ strict: true });
    return json({ config, status: popupStatus(config), storage: storageMode() });
  } catch (err) {
    console.error("[popup] admin read failed:", err instanceof Error ? err.message : err);
    return json({ message: "Couldn't read the popup settings from storage." }, 502);
  }
}

export async function PUT(request: Request) {
  if (!isSameOrigin(request)) return json({ message: "This request was blocked." }, 403);
  if (!(await isAdmin())) return json({ message: "Your session has ended. Please sign in again." }, 401);

  const body = await readJson(request, 20_000);
  if (body === undefined) return json({ message: "We couldn't read that. Please try again." }, 400);

  const parsed = popupSchema.safeParse(body);
  if (!parsed.success) {
    return json({ message: "Please fix the highlighted fields.", errors: fieldErrors(parsed.error) }, 400);
  }

  try {
    const config = await savePopup(parsed.data);
    return json({ config, status: popupStatus(config), storage: storageMode() });
  } catch (err) {
    if (err instanceof StorageNotConfiguredError) {
      return json(
        {
          message:
            "Saving isn't set up yet: this site needs a storage connection (Upstash Redis) in the hosting settings.",
        },
        503,
      );
    }
    console.error("[popup] save failed:", err instanceof Error ? err.message : err);
    return json({ message: "Your changes couldn't be saved. Please try again." }, 502);
  }
}
